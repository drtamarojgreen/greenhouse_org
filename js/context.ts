/**
 * @file context.ts
 * @description Shared ES module state containers for multi-part simulations.
 */

export const GreenhouseDopamine: any = {};
export const GreenhouseSerotonin: any = {};
export const GreenhouseDNARepair: any = {};
export const GreenhouseSynapseApp: any = {};
export const Greenhouse: any = {};
export const RNARepairSimulation: any = function () {};
RNARepairSimulation.state = { rnaStrand: [] };
