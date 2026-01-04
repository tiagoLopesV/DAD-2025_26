export const handleCoinEvents = (io, socket) => {
  socket.on('join_coin_updates', (userId) => {
    const channel = `user.${userId}.coins`;
    socket.join(channel);
    console.log(`[Coins] User ${userId} listening for balance updates on ${channel}`);
  });
};