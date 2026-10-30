import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { extrasInPeriod, extrasTotal, diariaFromTrechos, empDiaria, fortnightPeriod, monthWorkDays, paidInPeriod, trechosResumo, weekPeriod, workingDaysBetween } from "../src/utils/vt.ts";

describe("VT", () => {
  test("diária soma cada transporte de ida e volta", () => {
    const trechos: any[] = [
      { id: "a", tipo: "trem", tarifa: 5.2, ida: 2, volta: 1 },
      { id: "b", tipo: "onibus", tarifa: 4.4, ida: 1, volta: 1 },
    ];
    assert.equal(diariaFromTrechos(trechos), 24.4);
    assert.equal(trechosResumo(trechos), "3 trem · 2 ônibus");
    assert.equal(empDiaria({ tarifaIda: 5, tarifaVolta: 5 }), 10);
  });
  test("dias pela escala de cada pessoa", () => {
    const out = { inicio: new Date(2026, 9, 1), fim: new Date(2026, 9, 31) };
    assert.equal(workingDaysBetween(out.inicio, out.fim, [1, 2, 3, 4, 5]), 22);
    assert.equal(workingDaysBetween(out.inicio, out.fim, [1, 2, 3, 4, 5, 6]), 27);
    assert.equal(workingDaysBetween(out.inicio, out.fim, [6, 0]), 9);
    assert.equal(monthWorkDays({ diasSemana: [2, 4], diasPrevistos: 0 }, new Date(2026, 9, 13), 22), 9);
    assert.equal(monthWorkDays({ diasManual: true, diasPrevistos: 12, diasSemana: [1] }, new Date(2026, 9, 13), 22), 12);
  });
  test("semana começa na segunda e quinzena divide no dia 15", () => {
    const w = weekPeriod(new Date(2026, 9, 15));
    assert.equal(w.inicio.getDate(), 12); assert.equal(w.fim.getDate(), 18);
    assert.equal(fortnightPeriod(new Date(2026, 9, 20)).inicio.getDate(), 16);
    assert.equal(fortnightPeriod(new Date(2026, 9, 20)).fim.getDate(), 31);
  });
  test("pago no período", () => {
    const w = weekPeriod(new Date(2026, 9, 15));
    assert.equal(paidInPeriod({ historicoPagamentos: [{ id: "1", data: "2026-10-12", dataInicio: "2026-10-12", dias: 5, valor: 50, periodoRef: "" }, { id: "2", data: "2026-10-01", dias: 5, valor: 30, periodoRef: "" }] }, w), 50);
  });

  test("transporte extra entra só no período da data da corrida", () => {
    const emp: any = { transportesExtras: [
      { id: "1", data: "2026-10-03", tipo: "uber", trajeto: "volta", valor: 32.5 },
      { id: "2", data: "2026-10-20", tipo: "99", trajeto: "volta", valor: 18.4 },
      { id: "3", data: "2026-09-30", tipo: "taxi", trajeto: "ida", valor: 50 },
    ] };
    const q1 = fortnightPeriod(new Date(2026, 9, 5));
    assert.equal(extrasTotal(emp, q1), 32.5);
    assert.equal(extrasInPeriod(emp, q1).length, 1);
    assert.equal(extrasTotal(emp, { inicio: new Date(2026, 9, 1), fim: new Date(2026, 9, 31) }), 50.9);
    assert.equal(extrasTotal({}, q1), 0);
  });
});
