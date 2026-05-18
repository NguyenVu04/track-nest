const TamaguiProvider = ({ children }) => children ?? null;
const createTamagui = (config) => config;
const createTokens = (tokens) => tokens;

module.exports = {
  TamaguiProvider,
  createTamagui,
  createTokens,
};
module.exports.default = TamaguiProvider;
