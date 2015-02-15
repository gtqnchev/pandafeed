var User = require('./../models/user'),
    File = require('./../models/file');

module.exports = {
    getAvatar: function(req, res) {
        File.getReadStream(req.params.file_id)
            .then(function(stream) {
                stream.pipe(res);
            });
    },

    serveAvatarForm: function(req, res) {
        res.render("avatar");
    },

    uploadAvatar: function(req, res) {
        var filepath = req.files.filename.path,
            filename = req.files.filename.originalname,
            user_token = req.cookies.pandafeed_token;

        File.saveAvatarFor(user_token, filename, filepath)
            .then(function() {
                res.redirect("/");
            });
    }
};
