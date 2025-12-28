import { AquarioCase } from "./AquarioCase.js";

const cases = [AquarioCase];

export const CaseRegistry = {
  list() {
    return cases;
  },
  getById(id) {
    return cases.find((c) => c.id === id) || cases[0];
  },
  defaultId: cases[0].id,
};
