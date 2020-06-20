const express = require('express');
const router = express.Router();

const passport = require('passport');
const pool = require('../database');
const { esDirector } = require('../lib/auth');
const nodemailer = require('nodemailer');

const path = require('path');
const multer = require('multer');
const fs = require('fs');
const uuid = require('uuid/v4');
const xlsx = require("xlsx");
const chart = require('chart.js');

//Sesión
router.get('/login', (req, res) => {
  res.render('director/login');
});

router.post('/login', (req, res, next) => {
  req.check('codigo', 'Código es requerido').notEmpty();
  req.check('password', 'Contraseña es requerida').notEmpty();
  const errors = req.validationErrors();
  if (errors.length > 0) {
    req.flash('message', errors[0].msg);
    res.redirect('/director/login');
  }
  passport.authenticate('director.login', {
    successRedirect: '/director/index',
    failureRedirect: '/director/login',
    failureFlash: true
  })(req, res, next);
});

router.get('/cerrarLogin', esDirector, (req, res) => {
  req.logOut();
  res.redirect('/');
});


// ----- NEGOCIO -------
router.get('/index', esDirector, (req, res) => {
  res.render('director/index');
});

router.get('/recuperarClave', (req, res) => {
  res.render('director/recuperarClave');
});

router.post('/recuperarClave', async (req, res) => {
  try {
    const { codigo, email } = req.body;
    //Consultar si existe el codigo ingresado en la tabla del Director
    const rowsDirector = await pool.query('SELECT fkIdUsuario FROM director WHERE codigoDirector = ?', [codigo]);
    let fkIdUsuario = 0;

    //Si la consulta arrojó al menos 1 resultado...
    if (rowsDirector.length > 0) {
      const director = rowsDirector[0];
      fkIdUsuario = director.fkIdUsuario;
    } else {
      req.flash('message', 'CÓDIGO y/o CORREO incorrectos');
      res.redirect('/director/index');
    }

    //Consultar si los correos coinciden
    const rowsUsuario = await pool.query('SELECT correoUsuario FROM usuario WHERE pkIdUsuario =?', [fkIdUsuario]);
    if (rowsUsuario.length > 0) {
      const usuario = rowsUsuario[0];
      if (email == usuario.correoUsuario) {
        //Correos coinciden, crear nuvea clave
        const nuevaClave = Math.random().toString(36).substring(7);
        //Actualizar clave
        await pool.query('UPDATE usuario SET claveUsuario = (aes_encrypt("' + nuevaClave + '","' + nuevaClave + '")) WHERE pkIdUsuario=' + fkIdUsuario + ';');
        //Enviar correo con la clave
        contentHTML = `
        <h1>Director, su nueva clave es</h1>
        <p>${nuevaClave}</p>
  
    `;
        //Configurar Emisor
        let transporter = nodemailer.createTransport({
          host: 'mail.lamegaplaza.com',
          port: 587,
          secure: false,
          auth: {
            user: 'prami@lamegaplaza.com',
            pass: 'pramipassprami'
          },
          tls: {
            rejectUnauthorized: false
          }
        });

        //configurar Receptor
        let info = await transporter.sendMail({
          from: '"Prami" <prami@lamegaplaza.com>', // sender address,
          to: email,
          subject: 'Recuperar contraseña',
          // text: 'Contenido'
          html: contentHTML
        })

        console.log('Message sent: %s', info.messageId);
        // Message sent: <b658f8ca-6296-ccf4-8306-87d57a0b4321@example.com>

        // Preview only available when sending through an Ethereal account
        console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
        // Preview URL: https://ethereal.email/message/WaQKMgKddxQDoou...

        req.flash('success', 'Datos enviados, por favor revise su correo electrónico');
        res.redirect('/director/index');
      } else {
        //Correos no coinciden
        req.flash('message', 'CÓDIGO y/o CORREO incorrectos');
        res.redirect('/director/index');
      }
    } else {

      req.flash('message', 'CÓDIGO y/o CORREO incorrectos');
      res.redirect('/director/index');
    }

  } catch (error) {
    console.log("error recuperando clave: ", error);
  }
});

//CONVENIOS
router.get('/convenio', esDirector, async (req, res) => {
  try {
    const rowsConvenio = await pool.query("SELECT nombreConvenio, descripcionConvenio FROM convenio");
    res.render('director/convenio/index', { rowsConvenio });
  } catch (error) {
    console.log(error);
  }
});

router.get('/convenio/crearConvenio', esDirector, (req, res) => {
  res.render('director/convenio/crearConvenio');
});

router.post('/convenio/crearConvenio', esDirector, async (req, res) => {
  try {
    const { nameCon, desCon } = req.body;
    const nuevoConvenio = { nombreConvenio: nameCon, descripcionConvenio: desCon }
    await pool.query("INSERT INTO convenio SET ?", [nuevoConvenio]);
    res.redirect('/director/convenio');
  } catch (error) {
    console.log(error);
  }
});

//GRUPOS
router.get('/grupos', esDirector, async (req, res) => {
  try {
    const rowsDirector = await pool.query("SELECT semestreActual FROM director");
    const semestreUnido = rowsDirector[0].semestreActual;
    const rowsGrupo = await pool.query("SELECT pkIdGrupo,nombreGrupo,semestre FROM grupo WHERE semestre=?", [semestreUnido]);
    const rowsPreregistro = await pool.query("SELECT grupo.semestre,grupo.nombreGrupo, preregistro.pkCodigoEstudiante,preregistro.nombresEstudiante,preregistro.apellidosEstudiante,preregistro.fkIdGrupo FROM grupo INNER JOIN preregistro ON preregistro.fkIdGrupo = grupo.pkIdGrupo WHERE semestre = ?;", [semestreUnido]);
    res.render('director/grupos/index', { rowsGrupo, rowsPreregistro });
  } catch (error) {
    console.log(error);
  }
});

router.get('/grupos/crearGrupo', esDirector, (req, res) => {
  res.render('director/grupos/crearGrupo');
});

router.post('/grupos/crearGrupo', esDirector, async (req, res) => {
  try {
    const { name } = req.body;
    const rowsDirector = await pool.query("SELECT semestreActual FROM director");
    const semestre = rowsDirector[0].semestreActual;
    const nuevoGrupo = { nombreGrupo: name, semestre }
    await pool.query("INSERT INTO grupo SET ?", [nuevoGrupo]);
    res.redirect('/director/grupos');
  } catch (error) {
    console.log(error);
  }
});

router.get('/grupos/grupo/:id', esDirector, async (req, res) => {
  try {
    const { id } = req.params;
    const rowsEstudiante = await pool.query("SELECT usuario.pkIdUsuario, usuario.nombreUsuario, usuario.apellidoUsuario, estudiante.pfkCodigoEstudiante, estudiante.correoInstitucional FROM estudiantegrupo INNER JOIN estudiante ON estudiantegrupo.fkCodigoEstudiante = estudiante.pfkCodigoEstudiante INNER JOIN usuario ON usuario.pkIdUsuario = estudiante.fkIdUsuario WHERE estudiantegrupo.fkIdGrupo = ?", [id]);
    const rowsGrupo = await pool.query("SELECT nombreGrupo FROM grupo WHERE pkIdGrupo=?", [id]);
    const nombreGrupo = rowsGrupo[0].nombreGrupo;
    res.render('director/grupos/grupo', { rowsEstudiante, nombreGrupo, id });
  } catch (error) {
    console.log(error);
  }
});


//SOLICITUDES REGISTRO EMPRESA
router.get('/solicitudes/', esDirector, async (req, res) => {
  try {
    const rowsRegistro = await pool.query("SELECT pkIdEmpresa, nitEmpresa, nombreEmpresa, descripcionCiudad FROM empresa INNER JOIN ciudad ON ciudad.pkIdCiudad = fkIdCiudad WHERE solicitudAceptada = 0");
    res.render('director/solicitudes/index', { rowsRegistro });
  } catch (error) {
    console.log(error);
  }

});

router.get('/solicitudes/solicitud/:id', esDirector, async (req, res) => {
  try {
    const { id } = req.params;
    const rowsEmpresa = await pool.query("SELECT empresa.pkIdEmpresa, empresa.nitEmpresa, empresa.nombreEmpresa, ciudad.descripcionCiudad, usuario.correoUsuario, usuario.telefonoUsuario, usuario.direccionUsuario  FROM empresa INNER JOIN usuario ON usuario.pkIdUsuario = empresa.fkIdUsuario INNER JOIN ciudad ON ciudad.pkIdCiudad = fkIdCiudad WHERE pkIdEmpresa = ?", [id]);
    //console.log(rowsEmpresa);
    res.render('director/solicitudes/solicitud', { rowsEmpresa });
  } catch (error) {
    console.log(error);
  }
});

router.post('/solicitudes/solicitud/acepto/:id', esDirector, async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query("UPDATE empresa SET solicitudAceptada = 1 WHERE pkIdEmpresa = ?", [id]);
    res.redirect('/director/solicitudes');
  } catch (error) {
    console.log(error);
  }
});

router.post('/solicitudes/solicitud/rechazo/:id', esDirector, async (req, res) => {
  try {
    const { id } = req.params;
    const idUsuario = await pool.query("SELECT fkIdUsuario FROM empresa WHERE pkIdEmpresa = ?", [id]);
    //console.log(idUsuario[0].fkIdUsuario);
    await pool.query("DELETE FROM empresa WHERE pkIdEmpresa = ?", [id]);
    await pool.query("DELETE FROM usuario WHERE pkIdUsuario = ?", [idUsuario[0].fkIdUsuario]);
    res.redirect('/director/solicitudes');
  } catch (error) {
    console.log(error);
  }
});


//Pre-registro

const getNombresSeparados = (nombresUnidos) => {
  try {
    const arrayNombres = nombresUnidos.split(" ");
    const apellidos = "" + arrayNombres[0] + " " + arrayNombres[1];
    var nombres = "";
    for (let index = 2; index < arrayNombres.length; index++) {
      nombres += arrayNombres[index] + " ";
    }
    const datos = { nombres, apellidos }
    return datos;

  } catch (error) {
    console.log(error);
    return undefined;
  }

};

const excelAJSON = (nombreArchivoConExtension) => {
  const excel = xlsx.readFile(
    path.join(__dirname, '../public/uploads/' + nombreArchivoConExtension)
  );
  var nombreHoja = excel.SheetNames; // regresa un array
  let datos = xlsx.utils.sheet_to_json(excel.Sheets[nombreHoja[0]]);
  return datos;
};


const storage = multer.diskStorage({
  destination: path.join(__dirname, '../public/uploads'),
  filename: (req, file, cb) => {
    cb(null, uuid() + path.extname(file.originalname));
  }
});

const uploadExcel = multer({
  storage,
  fileFilter: function (req, file, cb) {

    var filetypes = /xlsx|/;
    var mimetype = filetypes.test(file.mimetype);
    var extname = filetypes.test(path.extname(file.originalname).toLowerCase());

    if (mimetype && extname) {
      return cb(null, true);
    }
    cb("Error: Solo se permiten archivos Excel con extensión: - " + filetypes);
  },
  limits: { fileSize: 10000000 },
}).single("excelfile");

router.post('/preregistro/:id', esDirector, async (req, res) => {
  try {
    uploadExcel(req, res, async (err) => {
      if (err) {
        err.message = 'El Excel debe pesar menos de 10mb';
        return res.send(err);
      }
      const fechaActual = new Date();
      const fechaPreregistro = fechaActual.getFullYear() + "-" + (fechaActual.getMonth() + 1) + "-" + fechaActual.getDate();
      const { id } = req.params;
      const estudiantesExcel = excelAJSON(req.file.filename);

      //console.log(estudiantesExcel.length);
      //Borrar archivo creado
      fs.unlinkSync(req.file.path)

      const nombresSeparadosCoordinador = getNombresSeparados(estudiantesExcel[0].Nombre);
      const preCoordinador = { pkCodigoCoordinador: estudiantesExcel[0].Código, nombreCoordinador: nombresSeparadosCoordinador.nombres, apellidoCoordinador: nombresSeparadosCoordinador.apellidos, fkIdGrupo: id, fechaPreregistro };
      await pool.query("INSERT INTO preregistrocoordinador SET ?", [preCoordinador]);

      const tamañoEstudiantes = estudiantesExcel.length - 1;
      var index = 1;

      while (index <= tamañoEstudiantes) {
        console.log(estudiantesExcel[index]);
        try {
          const nombresSeparados = getNombresSeparados(estudiantesExcel[index].Nombre);
          const preEstudiante = { pkCodigoEstudiante: estudiantesExcel[index].Código, nombresEstudiante: nombresSeparados.nombres, apellidosEstudiante: nombresSeparados.apellidos, fkIdGrupo: id, fechaPreregistro };
          pool.query("INSERT INTO preregistro SET ?", [preEstudiante]);
          index++;
        }
        catch (error) {
          console.log(error);
          req.flash("message", "Error procesando el pre-registro");
          res.redirect('/director/grupos');
        }

      }




      /*
      estudiantesExcel.map(async (estudiante) => {
        const nombresSeparados = getNombresSeparados(estudiante.Nombre);
        const preEstudiante = { pkCodigoEstudiante: estudiante.Código, nombresEstudiante: nombresSeparados.nombres, apellidosEstudiante: nombresSeparados.apellidos, fkIdGrupo: id, fechaPreregistro };
        await pool.query("INSERT INTO preregistro SET ?", [preEstudiante]);
      });
      */
      req.flash("success", "Pre-registro exitoso");
      res.redirect('/director/grupos');
    });
  } catch (error) {
    console.log(error);
    req.flash("message", "Error procesando el pre-registro");
    res.redirect('/director/grupos');
  }
});


router.get('/informes', esDirector, async (req, res) => {
  try {
    res.render('director/informes/index');
  } catch (error) {
    console.log(error);
    res.redirect('director/index');
  }

});

router.get('/informes/realizandoPracticas', esDirector, async (req, res) => {
  try {
    const rowsEstudiantesEnPracticas = await pool.query("SELECT estudiantegrupo.pkIdEstudianteGrupo ,usuario.nombreUsuario, estudiante.pfkCodigoEstudiante FROM estudiantegrupo INNER JOIN grupo ON estudiantegrupo.fkIdGrupo=grupo.pkIdGrupo INNER JOIN estudiante ON estudiantegrupo.fkCodigoEstudiante=estudiante.pfkCodigoEstudiante INNER JOIN usuario ON estudiante.fkIdUsuario=usuario.pkIdUsuario WHERE grupo.semestre=? AND estudiante.estaEnPracticas=1", [req.session.semestreActual]);
    const rowsEstudiantesSinPracticas = await pool.query("SELECT estudiantegrupo.pkIdEstudianteGrupo ,usuario.nombreUsuario, estudiante.pfkCodigoEstudiante FROM estudiantegrupo INNER JOIN grupo ON estudiantegrupo.fkIdGrupo=grupo.pkIdGrupo INNER JOIN estudiante ON estudiantegrupo.fkCodigoEstudiante=estudiante.pfkCodigoEstudiante INNER JOIN usuario ON estudiante.fkIdUsuario=usuario.pkIdUsuario WHERE grupo.semestre=? AND estudiante.estaEnPracticas=0", [req.session.semestreActual]);
    const cantidadEnPracticas = rowsEstudiantesEnPracticas.length;
    const cantidadSinPracticas = rowsEstudiantesSinPracticas.length;
    const total = cantidadEnPracticas + cantidadSinPracticas;
    //console.log(req.session.semestreActual);
    //console.log(rowsEstudiantesSinPracticas);
    res.render('director/informes/realizandoPracticas', { rowsEstudiantesEnPracticas, rowsEstudiantesSinPracticas, cantidadEnPracticas, cantidadSinPracticas, total });
  } catch (error) {
    console.log(error);
    res.redirect('director/index');
  }


});

router.get('/informes/porCiudad', esDirector, async (req, res) => {
  try {
    const rowsEstudiantesEnPracticas = await pool.query("SELECT estudiantegrupo.pkIdEstudianteGrupo ,usuario.nombreUsuario, estudiante.pfkCodigoEstudiante, ciudad.descripcionCiudad FROM estudiantegrupo INNER JOIN grupo ON estudiantegrupo.fkIdGrupo=grupo.pkIdGrupo INNER JOIN estudiante ON estudiantegrupo.fkCodigoEstudiante=estudiante.pfkCodigoEstudiante INNER JOIN usuario ON estudiante.fkIdUsuario=usuario.pkIdUsuario INNER JOIN contrato ON contrato.fkIdEstudianteGrupo=estudiantegrupo.pkIdEstudianteGrupo INNER JOIN empresa ON empresa.pkIdEmpresa = contrato.fkIdEmpresa INNER JOIN ciudad on ciudad.pkIdCiudad= empresa.fkIdCiudad WHERE grupo.semestre=? AND estudiante.estaEnPracticas=1 ORDER BY ciudad.descripcionCiudad ASC;", [req.session.semestreActual]);
    res.render('director/informes/porCiudad', { rowsEstudiantesEnPracticas });
  } catch (error) {
    console.log(error);
    res.redirect('/director/index');
  }

});

router.get('/informes/porEmpresa', esDirector, async (req, res) => {
  try {
    const rowsEstudiantesEnPracticas = await pool.query("SELECT estudiantegrupo.pkIdEstudianteGrupo ,usuario.nombreUsuario, estudiante.pfkCodigoEstudiante, empresa.nombreEmpresa FROM estudiantegrupo INNER JOIN grupo ON estudiantegrupo.fkIdGrupo=grupo.pkIdGrupo INNER JOIN estudiante ON estudiantegrupo.fkCodigoEstudiante=estudiante.pfkCodigoEstudiante INNER JOIN usuario ON estudiante.fkIdUsuario=usuario.pkIdUsuario INNER JOIN contrato ON contrato.fkIdEstudianteGrupo=estudiantegrupo.pkIdEstudianteGrupo INNER JOIN empresa ON empresa.pkIdEmpresa = contrato.fkIdEmpresa WHERE grupo.semestre=? AND estudiante.estaEnPracticas=1 ORDER BY empresa.nombreEmpresa ASC;", [req.session.semestreActual]);
    res.render('director/informes/porEmpresa', { rowsEstudiantesEnPracticas });
  } catch (error) {
    console.log(error);
    res.redirect('/director/index');
  }

});


router.get('/editarInformacion', esDirector, async (req, res) => {
  try {
    const rowsAnioSemestre = await pool.query("SELECT semestreActual FROM director WHERE fkIdUsuario = ?", [req.session.passport.user]);
    const semestreActual = rowsAnioSemestre[0].semestreActual;
    console.log(semestreActual);
    res.render('director/editarInformacion', { semestreActual });
  } catch (error) {
    console.log(error);
    res.redirect('/director/index');
  }

});


router.post('/actualizarAnioSemestre', esDirector, async (req, res) => {
  try {
    const { anioSemestre } = req.body;
    await pool.query("UPDATE director SET semestreActual = ? WHERE fkIdUsuario = ?", [anioSemestre, req.session.passport.user]);
    res.redirect('/director/index');
  } catch (error) {
    console.log(error);
  }
});

router.post("/cambiarClave", async (req, res) => {
  try {
    const { passwordA, passwordN } = req.body;
    const idUsuario = req.session.passport.user;
    //Consultar contraseña actual y comparar con la ingresada

    const rowContra = await pool.query('SELECT CAST(aes_decrypt(claveUsuario,"' + passwordA + '")AS CHAR(200))claveUsuario FROM usuario WHERE pkIdUsuario =' + idUsuario);
    const contraConsulta = rowContra[0].claveUsuario;

    //si es la misma, actualizar en bd
    if (contraConsulta == passwordA) {
      await pool.query(
        'UPDATE usuario SET claveUsuario = (aes_encrypt("' +
        passwordN +
        '","' +
        passwordN +
        '")) WHERE pkIdUsuario=' +
        idUsuario +
        ";"
      );

      req.flash(
        "success",
        "CONTRASEÑA actualizada"
      );
      res.redirect("/director/index");
    } else {
      req.flash("message", "CONTRASEÑA incorrecta");
      res.redirect("/director/index");
    }

  } catch (error) {
    console.log(error);
    res.redirect("/");
  }
});

module.exports = router;