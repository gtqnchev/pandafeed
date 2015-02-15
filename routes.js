var mainHandlers = require('./handlers/main'),
    socketHandlers = require('./handlers/socket'),
    fileHandlers = require('./handlers/file');

module.exports = function(app, io) {
    app.get("/login", mainHandlers.serveLogin);
    app.post("/login", mainHandlers.loginUser);
    app.get("/logout", mainHandlers.logoutUser);

    app.get("/register", mainHandlers.serveRegister);
    app.post("/register", mainHandlers.registerUser);

    app.get('/avatar/:file_id', fileHandlers.getAvatar);

    app.use(mainHandlers.authMiddleware);

    app.get("/", mainHandlers.serveChat);
    app.get("/ranklist", mainHandlers.serveRanklist);

    app.get('/avatar', fileHandlers.serveAvatarForm);
    app.post('/avatar', fileHandlers.uploadAvatar);

    io.on('connection', function (socket) {
        var handlers = socketHandlers(socket);

        socket.emit('request_authentication');

        socket.on('authenticate', handlers.authenticate);
        socket.on('message', handlers.message);
        socket.on('history', handlers.history);
        socket.on('disconnect', handlers.disconnect);

        socket.on('block', handlers.block);
        socket.on('unblock', handlers.unblock);

        socket.on('like', handlers.like);
        socket.on('unlike', handlers.unlike);
    });
};
