var multer = require('multer'),
    cp = require('cookie-parser'),
    fileSystem = require('fs'),
    path = require('path');

module.exports = function(mongoose, app, User) {
    var File = require('./models/file')(mongoose, User);
    app.use(multer());
    app.use(cp());

    app.get('/avatar/:file_id', function(req, res) {
        var read_stream = File.readStream(req.params.file_id);

        read_stream.on('error', function(err) {
            var filePath = path.join(__dirname, '/public/images/70x70.gif');
            var default_stream = fileSystem.createReadStream(filePath);
            default_stream.pipe(res);
        });

        read_stream.pipe(res);
    });

    app.get('/avatar', function(req, res) {
        User.findByToken(req.cookies.pandafeed_token)
            .then(function(user) {
                if(user){
                    res.render("avatar");
                }
                else {
                    res.redirect("/login");
                }
            });
    });

    app.post('/avatar', function(req, res) {
        User.findByToken(req.cookies.pandafeed_token)
            .then(function(user) {
                if(user){
                    var tempfile = req.files.filename.path,
                        file     = new File(user._id, user.avatar_id, req.files.filename.originalname);

                    file.save_from(tempfile, function() {
                        res.redirect("/chat");
                    });
                }
                else {
                    res.redirect("/login");
                }});
    });
};
