const blacklistedRefreshTokens = new Set();

const blacklistRefreshToken = (token) => {
  if (token) {
    blacklistedRefreshTokens.add(token);
  }
};

const isRefreshTokenBlacklisted = (token) => blacklistedRefreshTokens.has(token);

const clearTokenStore = () => {
  blacklistedRefreshTokens.clear();
};

module.exports = {
  blacklistRefreshToken,
  isRefreshTokenBlacklisted,
  clearTokenStore,
};