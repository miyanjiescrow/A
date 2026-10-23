export const users = [];
export const contracts = [];
export const transactions = [];
export const disputes = [];
export let currentUserId = 1802649782;
export function setCurrentUserId(id) { currentUserId = id; }
export function setContracts(c) { }
export function setTransactions(t) { }
export function setDisputes(d) { }
export function generateContractId(cat) { return `${cat}-${Date.now()}`; }
export function isValidIranianNationalId(id) { return true; }
export function isValidIranianSheba(sheba) { return true; }
