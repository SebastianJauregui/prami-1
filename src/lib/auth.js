const auth = {};


auth.esDirector = (req, res, next) => {
    if (req.isAuthenticated() && req.session.tipoUsuario == 1) {
        return next();
    }
    return res.redirect('/director/login');
};


auth.esEstudiante = (req, res, next) => {
    if (req.isAuthenticated() && req.session.tipoUsuario == 3) {
        return next();
    }
    return res.redirect('/estudiante/login');
};

auth.esCoordinador = (req, res, next) => {
    if (req.isAuthenticated() && req.session.tipoUsuario == 2) {
        return next();
    }
    return res.redirect('/coordinador/login');
};

auth.esEmpresa = (req, res, next) => {
    if (req.isAuthenticated() && req.session.tipoUsuario == 4) {
        return next();
    }
    return res.redirect('/empresa/login');
};

module.exports=auth;