const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;

const pool = require('../database');
const helpers = require('./helpers');


//---- Director ---- //

passport.use('director.login', new LocalStrategy({
  usernameField: 'codigo',
  passwordField: 'password',
  passReqToCallback: true
}, async (req, codigo, password, done) => {
  try {

    //Consultar si existe el codigo ingresado en la tabla del Director
    const rowsDirector = await pool.query('SELECT fkIdUsuario, semestreActual FROM director WHERE codigoDirector = ?', [codigo]);
    let fkIdUsuario = 0;

    //Si la consulta arrojó al menos 1 resultado...
    if (rowsDirector.length > 0) {
      const director = rowsDirector[0];
      fkIdUsuario = director.fkIdUsuario;
      const temp = parseInt(fkIdUsuario, 10);
      fkIdUsuario = temp;
      console.log("el pkUsuario del fk es: ", fkIdUsuario);
    } else {
      done(null, false, req.flash('message', 'Código y/o contraseña incorrectos'));
    }
    const semestre = rowsDirector[0].semestreActual;
    //console.log("semestre " +semestre);
    //Consultar si las contraseñas coinciden
    const rowsUsuario = await pool.query('SELECT CAST(aes_decrypt(claveUsuario,"' + password + '")AS CHAR(200))claveUsuario FROM usuario WHERE pkIdUsuario =' + fkIdUsuario);
    if (rowsUsuario.length > 0) {
      const usuario = rowsUsuario[0];
      console.log("el usuario es: ", usuario);
      console.log("la clave desencriptada es:", usuario.claveUsuario);
      if (password == usuario.claveUsuario) {
        //Contraseñas coinciden 
        usuario.id = fkIdUsuario;
        req.session.tipoUsuario = 1;
        req.session.semestreActual = semestre;
        done(null, usuario);
      } else {
        //Contraseñas no coinciden
        done(null, false, req.flash('message', 'Código y/o contraseña incorrectos'));
      }
    } else {
      done(null, false, req.flash('message', 'Código y/o contraseña incorrectos'));
    }
  } catch (error) {
    console.log("error en director.login: ", error);
    done(null, false, req.flash('message', 'Código y/o contraseña incorrectos'));
  }
}));

//---- Estudiante ----//

passport.use('estudiante.registro', new LocalStrategy({
  usernameField: 'codigoEstudiante',
  passwordField: 'password',
  passReqToCallback: true
}, async (req, codigoEstudiante, password, done) => {
  try {
    const { dni, email, date } = req.body;
    //Verificar si existe pre-registro y si no existe registro aún
    const rowsPreregistro = await pool.query("SELECT nombresEstudiante, apellidosEstudiante, fkIdGrupo FROM preregistro WHERE pkCodigoEstudiante=?", [codigoEstudiante]);;
    const rowsRegistro = await pool.query("SELECT pfkCodigoEstudiante FROM estudiante WHERE pfkCodigoEstudiante=?", [codigoEstudiante]);
    if (rowsRegistro.length == 0 && rowsPreregistro.length == 1) {
      //Crear usuario
      const estudiante = rowsPreregistro[0];
      const fechaActual = new Date();
      const fechaRegistro = fechaActual.getFullYear() + "-" + (fechaActual.getMonth() + 1) + "-" + fechaActual.getDate();
      let newUser = {
        cedulaUsuario: dni,
        nombreUsuario: estudiante.nombresEstudiante,
        apellidoUsuario: estudiante.apellidosEstudiante,
        fechaRegistro,
        claveUsuario: password,
        fechaNacimiento: date
      };

      //Registrar Usuario
      const resultUsuario = await pool.query('INSERT INTO usuario (claveUsuario,cedulaUsuario,nombreUsuario,apellidoUsuario,fechaRegistro,fechaNacimiento) VALUES (aes_encrypt("' + password + '","' + password + '"),?,?,?,?,?) ',
        [dni, estudiante.nombresEstudiante, estudiante.apellidosEstudiante, fechaRegistro, date]);

      //Crear Estudiante
      const idUsuario = resultUsuario.insertId;
      let newEstudiante = {
        pfkCodigoEstudiante: codigoEstudiante,
        estaEnPracticas: 0,
        edadEstudiante: 22,
        semestreEstudiante: 9,
        fkIdUsuario: idUsuario,
        correoInstitucional: email
      };
      //Registrar Estudiante
      await pool.query("INSERT INTO estudiante SET ?", [newEstudiante]);

      //Incluir estudiante en un grupo
      const newEstudianteGrupo = {
        fkIdGrupo: estudiante.fkIdGrupo,
        fkCodigoEstudiante: codigoEstudiante
      }
      await pool.query("INSERT INTO estudiantegrupo SET ?", [newEstudianteGrupo]);
      
      req.session.tipoUsuario = 3;
      req.session.codigoEstudiante = codigoEstudiante;
      const rowsDirector = await pool.query("SELECT semestreActual FROM director");
      const semestre = rowsDirector[0].semestreActual;
      const rowsEstudianteGrupo = await pool.query("SELECT estudiantegrupo.pkIdEstudianteGrupo, grupo.pkIdGrupo FROM estudiante INNER JOIN estudiantegrupo ON estudiantegrupo.fkCodigoEstudiante=estudiante.pfkCodigoEstudiante INNER JOIN grupo ON grupo.pkIdGrupo=estudiantegrupo.fkIdGrupo WHERE estudiante.pfkCodigoEstudiante=? AND grupo.semestre=?", [codigoEstudiante, semestre]);
      const estudianteGrupo = rowsEstudianteGrupo[0];
      req.session.pkIdEstudianteGrupo = estudianteGrupo.pkIdEstudianteGrupo;
      req.session.semestreActual = semestre;
      req.session.grupo = estudianteGrupo.pkIdGrupo;
      newUser.id = idUsuario;
      return done(null, newUser, req.flash('success', "Bienvenido"));
    } else {
      return done(null, null, req.flash('message', "Estudiante no pre-registrado o Estudiante ya registrado"));
    }

  } catch (error) {
    console.log(error);
    return done(null, null, req.flash('message', "Error al registrarse, verifique sus datos"));
  }
}));


passport.use('estudiante.login', new LocalStrategy({
  usernameField: 'codigo',
  passwordField: 'password',
  passReqToCallback: true
}, async (req, codigo, password, done) => {
  try {

    //Consultar si existe el codigo ingresado en la tabla del Director
    const rowsEstudiante = await pool.query('SELECT fkIdUsuario FROM estudiante WHERE pfkCodigoEstudiante  = ?', [codigo]);
    let fkIdUsuario = 0;

    //Si la consulta arrojó 1 resultado...
    console.log("+++++++++++++++++rows estudiante ", rowsEstudiante.length);
    if (rowsEstudiante.length == 1) {
      const estudiante = rowsEstudiante[0];
      fkIdUsuario = estudiante.fkIdUsuario;
    } else {
      done(null, false, req.flash('message', 'Código y/o contraseña incorrectos 1'));
    }

    //Consultar si las contraseñas coinciden
    const rowsUsuario = await pool.query('SELECT CAST(aes_decrypt(claveUsuario,"' + password + '")AS CHAR(200))claveUsuario FROM usuario WHERE pkIdUsuario =' + fkIdUsuario);
    if (rowsUsuario.length == 1) {
      const usuario = rowsUsuario[0];
      if (password == usuario.claveUsuario) {
        //Contraseñas coinciden 
        usuario.id = fkIdUsuario;
        req.session.tipoUsuario = 3;
        req.session.codigoEstudiante = codigo;
        const rowsDirector = await pool.query("SELECT semestreActual FROM director");
        const semestre = rowsDirector[0].semestreActual;
        const rowsEstudianteGrupo = await pool.query("SELECT estudiantegrupo.pkIdEstudianteGrupo, grupo.pkIdGrupo FROM estudiante INNER JOIN estudiantegrupo ON estudiantegrupo.fkCodigoEstudiante=estudiante.pfkCodigoEstudiante INNER JOIN grupo ON grupo.pkIdGrupo=estudiantegrupo.fkIdGrupo WHERE estudiante.pfkCodigoEstudiante=? AND grupo.semestre=?", [codigo, semestre]);
        const estudianteGrupo = rowsEstudianteGrupo[0];
        req.session.pkIdEstudianteGrupo = estudianteGrupo.pkIdEstudianteGrupo;
        req.session.semestreActual = semestre;
        req.session.grupo = estudianteGrupo.pkIdGrupo;
        console.log("++++++++++++++++++toy aqui");
        done(null, usuario);
      } else {
        //Contraseñas no coinciden
        done(null, false, req.flash('message', 'Código y/o contraseña incorrectos 2'));
      }
    } else {
      done(null, false, req.flash('message', 'Código y/o contraseña incorrectos 3'));
    }
  } catch (error) {
    console.log("error en director.login: ", error);
    done(null, false, req.flash('message', 'Código y/o contraseña incorrectos 3'));
  }
}));


//---- Coordinador ----//

passport.use('coordinador.registro', new LocalStrategy({
  usernameField: 'codigo',
  passwordField: 'password',
  passReqToCallback: true
}, async (req, codigo, password, done) => {
  try {
    const { email, personalEmail } = req.body;
    //Verificar si existe pre-registro y si no existe registro aún
    const rowsPreCoordinador = await pool.query("SELECT pkCodigoCoordinador,nombreCoordinador,apellidoCoordinador,fkIdGrupo FROM preregistrocoordinador WHERE pkCodigoCoordinador=?", [codigo]);
    
    if (rowsPreCoordinador.length != 1) {
      throw "***** No existe pre-registro de coordinador";
    }

    const fechaActual = new Date();
    const fecha = fechaActual.getFullYear() + "-" + (fechaActual.getMonth() + 1) + "-" + fechaActual.getDate();

    const preCoordinador = rowsPreCoordinador[0];
    //console.log(preCoordinador.pkCodigoCoordinador);

    let newUsuario = { nombreUsuario: preCoordinador.nombreCoordinador, apellidoUsuario: preCoordinador.apellidoCoordinador, fechaRegistro: fecha };
    //console.log(newUsuario);
    let insertUsuario = {};
    if (personalEmail != "") {
      newUsuario.correoUsuario = personalEmail;
      //console.log(newUsuario);
      insertUsuario = await pool.query('INSERT INTO usuario (nombreUsuario,apellidoUsuario,fechaRegistro,correoUsuario,claveUsuario) VALUES (?,?,?,?, aes_encrypt("' + password + '","' + password + '"))', [newUsuario.nombreUsuario, newUsuario.apellidoUsuario, newUsuario.fechaRegistro, newUsuario.correoUsuario]);
    }
    else {
      insertUsuario = await pool.query('INSERT INTO usuario (nombreUsuario,apellidoUsuario,fechaRegistro,claveUsuario) VALUES (?,?,?,aes_encrypt("' + password + '","' + password + '"))', [newUsuario.nombreUsuario, newUsuario.apellidoUsuario, newUsuario.fechaRegistro]);
    }

    //console.log(insertUsuario);
    const newCoordinador = { pfkCodigoCoordinador: preCoordinador.pkCodigoCoordinador, correoInstitucional: email, fkIdUsuario: insertUsuario.insertId };
    const insertCoordinador = await pool.query("INSERT INTO coordinador SET ?", [newCoordinador]);

    const coordinadorGrupo = { fkIdGrupo: preCoordinador.fkIdGrupo, fkCodigoCoordinador: preCoordinador.pkCodigoCoordinador };
    const cg = await pool.query("INSERT INTO coordinadorgrupo SET ?", [coordinadorGrupo]);

    const usuario = { id: insertUsuario.insertId };
    req.session.tipoUsuario = 2;
    req.session.codigocoordinador = codigo;
    const rowsDirector = await pool.query("SELECT semestreActual FROM director");
    const semestre = rowsDirector[0].semestreActual;
    req.session.semestreActual = semestre;
    req.session.pkIdCoordinadorGrupo = cg.insertId;
    done(null, usuario);


  } catch (error) {
    console.log(error);
    return done(null, null, req.flash('message', "Error al registrarse, verifique sus datos"));
  }
}));


passport.use('coordinador.login', new LocalStrategy({
  usernameField: 'codigo',
  passwordField: 'password',
  passReqToCallback: true
}, async (req, codigo, password, done) => {
  try {

    //Consultar si existe el codigo ingresado en la tabla del Coordinador
    const rowsCoordinador = await pool.query('SELECT fkIdUsuario FROM coordinador WHERE pfkCodigoCoordinador  = ?', [codigo]);
    let fkIdUsuario = 0;

    //Si la consulta arrojó 1 resultado...
    //console.log("+++++++++++++++++rows estudiante ", rowsCoordinador.length);
    if (rowsCoordinador.length == 1) {
      const coordinador = rowsCoordinador[0];
      fkIdUsuario = coordinador.fkIdUsuario;
    } else {
      done(null, false, req.flash('message', 'Código y/o contraseña incorrectos 1'));
    }

    //Consultar si las contraseñas coinciden
    const rowsUsuario = await pool.query('SELECT CAST(aes_decrypt(claveUsuario,"' + password + '")AS CHAR(200))claveUsuario FROM usuario WHERE pkIdUsuario =' + fkIdUsuario);
    if (rowsUsuario.length == 1) {
      const usuario = rowsUsuario[0];
      if (password == usuario.claveUsuario) {
        //Contraseñas coinciden 
        usuario.id = fkIdUsuario;
        req.session.tipoUsuario = 2;
        req.session.codigoCoordinador = codigo;
        const rowsDirector = await pool.query("SELECT semestreActual FROM director");
        const semestre = rowsDirector[0].semestreActual;
        req.session.semestreActual = semestre;
        const rowsCoordinadorGrupo=await pool.query("SELECT coordinadorgrupo.pkIdCoordinadorGrupo FROM coordinadorgrupo INNER JOIN grupo ON grupo.pkIdGrupo=coordinadorgrupo.fkIdGrupo WHERE coordinadorgrupo.fkCodigoCoordinador=? AND grupo.semestre=?",[codigo,semestre]);
        const cg=rowsCoordinadorGrupo[0];
        req.session.pkIdCoordinadorGrupo=cg.pkIdCoordinadorGrupo;
        done(null, usuario);
      } else {
        //Contraseñas no coinciden
        done(null, false, req.flash('message', 'Código y/o contraseña incorrectos 2'));
      }
    } else {
      done(null, false, req.flash('message', 'Código y/o contraseña incorrectos 3'));
    }
  } catch (error) {
    console.log("error en coordinador.login: ", error);
    done(null, false, req.flash('message', 'Código y/o contraseña incorrectos 3'));
  }
}));


//EMPRESA

passport.use('empresa.registro', new LocalStrategy({
  usernameField: 'nitEmpresa',
  passwordField: 'password',
  passReqToCallback: true
}, async (req, nitEmpresa, password, done) => {
  try {
    const { nameEmpresa, email, telefono, direccion, ciudad } = req.body;
    const fechaActual = new Date();
    const fecha = fechaActual.getFullYear() + "-" + (fechaActual.getMonth() + 1) + "-" + fechaActual.getDate();
    let newUsuario = { direccionUsuario:direccion, correoUsuario: email, telefonoUsuario:telefono, fechaRegistro: fecha };
    const insertUsuario = await pool.query('INSERT INTO usuario (direccionUsuario,telefonoUsuario,fechaRegistro,correoUsuario,claveUsuario) VALUES (?,?,?,?, aes_encrypt("' + password + '","' + password + '"))', [newUsuario.direccionUsuario, newUsuario.telefonoUsuario, newUsuario.fechaRegistro, newUsuario.correoUsuario]);;

    const newEmpresa = { nitEmpresa: nitEmpresa, nombreEmpresa: nameEmpresa, solicitudAceptada:0, fkIdCiudad:ciudad, fkIdUsuario: insertUsuario.insertId };
    await pool.query("INSERT INTO empresa SET ?", [newEmpresa]);

    const usuario = { id: insertUsuario.insertId };
    req.session.tipoUsuario = 4;
    req.session.nitempresa = nitEmpresa;
    done(null, usuario);
  } catch (error) {
    console.log(error);
    return done(null, null, req.flash('message', "Error al registrarse, verifique sus datos"));
  }
}));


passport.use('empresa.login', new LocalStrategy({
  usernameField: 'nitEmpresa',
  passwordField: 'password',
  passReqToCallback: true
}, async (req, nitEmpresa, password, done) => {
  try {

    //Consultar si existe el codigo ingresado en la tabla Empresa
    const rowsEmpresa = await pool.query('SELECT fkIdUsuario FROM empresa WHERE nitEmpresa  = ?', [nitEmpresa]);
    let fkIdUsuario = 0;

    //Si la consulta arrojó 1 resultado...
    if (rowsEmpresa.length == 1) {
      const empresa = rowsEmpresa[0];
      fkIdUsuario = empresa.fkIdUsuario;
    } else {
      done(null, false, req.flash('message', 'NIT y/o contraseña incorrectos 1'));
    }

    //Consultar si las contraseñas coinciden
    const rowsUsuario = await pool.query('SELECT CAST(aes_decrypt(claveUsuario,"' + password + '")AS CHAR(200))claveUsuario FROM usuario WHERE pkIdUsuario =' + fkIdUsuario);
    if (rowsUsuario.length == 1) {
      const usuario = rowsUsuario[0];
      if (password == usuario.claveUsuario) {
        //Contraseñas coinciden 
        usuario.id = fkIdUsuario;
        req.session.tipoUsuario = 4;
        req.session.nitEmpresa = nitEmpresa;
        done(null, usuario);
      } else {
        //Contraseñas no coinciden
        done(null, false, req.flash('message', 'NIT y/o contraseña incorrectos 2'));
      }
    } else {
      done(null, false, req.flash('message', 'NIT y/o contraseña incorrectos 3'));
    }
  } catch (error) {
    console.log("error en empresa.login: ", error);
    done(null, false, req.flash('message', 'NIT y/o contraseña incorrectos 4'));
  }
}));

// ---- Comun
passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  const rows = await pool.query('SELECT * FROM usuario WHERE pkIdUsuario  = ?', [id]);
  done(null, rows[0]);
});

