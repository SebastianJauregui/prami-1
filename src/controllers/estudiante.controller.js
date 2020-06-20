const express = require("express");
const router = express.Router();

const passport = require("passport");
const pool = require("../database");
const { esEstudiante } = require("../lib/auth");
const helpers = require("../lib/helpers");
const nodemailer = require("nodemailer");
const path = require('path');
const multer = require('multer');
const fs = require('fs');
const uuid = require('uuid/v4');

// SIGNUP
router.get("/registro", (req, res) => {
  res.render("estudiante/registro");
});

router.post(
  "/registro",
  passport.authenticate("estudiante.registro", {
    successRedirect: "/estudiante/index",
    failureRedirect: "/estudiante/registro",
    failureFlash: true
  })
);

//SIGNIN
router.get("/login", (req, res) => {
  res.render("estudiante/login");
});

router.post("/login", (req, res, next) => {
  req.check("codigo", "Código es requerido").notEmpty();
  req.check("password", "Contraseña es requerida").notEmpty();
  const errors = req.validationErrors();
  if (errors.length > 0) {
    req.flash("message", errors[0].msg);
    res.redirect("/estudiante/login");
  }
  passport.authenticate("estudiante.login", {
    successRedirect: "/estudiante/index",
    failureRedirect: "/estudiante/login",
    failureFlash: true
  })(req, res, next);
});

router.get("/cerrarLogin", esEstudiante, (req, res) => {
  req.logOut();
  res.redirect("/");
});

// ----- NEGOCIO -------
router.get("/index", esEstudiante, async (req, res) => {
  try {
    console.log(req.session.passport.user);
    const rowsUsuario = await pool.query("SELECT estudiante.fkIdHojaVida, usuario.fkIdImg, usuario.direccionUsuario, usuario.correoUsuario, usuario.telefonoUsuario, estudiante.semestreEstudiante, usuario.nombreUsuario, usuario.apellidoUsuario, usuario.fechaNacimiento, estudiante.descripcionPersonalizada, estudiante.pfkCodigoEstudiante FROM usuario INNER JOIN estudiante ON usuario.pkIdUsuario=estudiante.fkIdUsuario WHERE usuario.pkIdUsuario = ?",
      [req.session.passport.user]);
    var estudiante = rowsUsuario[0];
    console.log(estudiante);
    const fechaActual = new Date();
    const year = fechaActual.getFullYear();
    estudiante.edad = year - (estudiante.fechaNacimiento.split("-")[0]);

    const fkIdHoja = rowsUsuario[0].fkIdHojaVida;
    if (fkIdHoja != undefined) {
      const rowsHoja = await pool.query("SELECT rutaHojaVida FROM hojavida WHERE pkIdHojaVida=?", [fkIdHoja]);
      estudiante.rutaHojaVida = rowsHoja[0].rutaHojaVida;
    }

    const fkIdImg = rowsUsuario[0].fkIdImg;
    if (fkIdImg != undefined) {
      const rowsImg = await pool.query("SELECT rutaImg FROM imagen WHERE pkIdImg=?", [fkIdImg]);
      estudiante.rutaImg = rowsImg[0].rutaImg;
    }
    const codigo = req.session.codigoEstudiante;
    const semestre = req.session.semestreActual;
    const idEstudianteGrupo=req.session.pkIdEstudianteGrupo;

    const rowsEmpresa=await pool.query("SELECT empresa.nombreEmpresa,empresa.pkIdEmpresa,contrato.fechaInicioPractica,contrato.fechaFinPractica FROM contrato INNER JOIN empresa ON contrato.fkIdEmpresa=empresa.pkIdEmpresa WHERE contrato.fkIdEstudianteGrupo=?",[idEstudianteGrupo]);
    
   res.render("estudiante/index", { estudiante, rowsEmpresa});
  } catch (error) {
    console.log(error);
  }
});

router.get("/editarPerfil", esEstudiante, async (req, res) => {
  try {
    const rowsUsuario = await pool.query(
      "SELECT usuario.correoUsuario, usuario.telefonoUsuario, usuario.direccionUsuario, estudiante.descripcionPersonalizada, estudiante.semestreEstudiante    FROM usuario INNER JOIN estudiante ON usuario.pkIdUsuario=estudiante.fkIdUsuario  WHERE usuario.pkIdUsuario =?",
      [req.session.passport.user]
    );
    const usuario = rowsUsuario[0];

    res.render("estudiante/editarPerfil", { usuario });
  } catch (error) {
    console.log(error);
    req.flash("message", "Error mostrando edición de perfil");
    res.redirect("/estudiante/index");
  }
});

router.post("/editarPerfil", esEstudiante, async (req, res) => {
  try {
    const { email, telefono, direccion, descripcion, semestre } = req.body;
    const idUsuario = req.session.passport.user;

    const nuevoUsuario = {
      correoUsuario: email,
      telefonoUsuario: telefono,
      direccionUsuario: direccion
    };
    await pool.query("UPDATE usuario SET ? WHERE pkIdUsuario=?", [
      nuevoUsuario,
      idUsuario
    ]);

    const nuevoEstudiante = {
      descripcionPersonalizada: descripcion,
      semestreEstudiante: semestre
    };
    await pool.query("UPDATE estudiante SET ? WHERE fkIdUsuario=?", [
      nuevoEstudiante,
      idUsuario
    ]);
    res.redirect("/estudiante/index");
  } catch (error) {
    console.log(error);
    req.flash("message", "Error editando perfil");
    res.redirect("/estudiante/index");
  }
});

router.get("/cambiarClave", (req, res) => {
  res.render("estudiante/cambiarClave");
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
      res.redirect("/estudiante/index");
    } else {
      req.flash("message", "CONTRASEÑA incorrecta");
      res.redirect("/estudiante/index");
    }

  } catch (error) {
    console.log(error);
    res.redirect("/");
  }
});

router.get("/recuperarClave", (req, res) => {
  res.render("estudiante/recuperarClave");
});

router.post("/recuperarClave", async (req, res) => {
  try {
    const { codigo, email } = req.body;
    //Consultar si existe el codigo ingresado en la tabla del Estudiante
    const rowsEstudiante = await pool.query(
      "SELECT fkIdUsuario,correoInstitucional FROM estudiante WHERE pfkCodigoEstudiante = ?",
      [codigo]
    );
    let fkIdUsuario = 0;

    //Si la consulta arrojó al menos 1 resultado...
    if (rowsEstudiante.length == 1) {
      const estudiante = rowsEstudiante[0];
      fkIdUsuario = estudiante.fkIdUsuario;
    } else {
      req.flash("message", "CÓDIGO y/o CORREO incorrectos");
      res.redirect("/estudiante/index");
    }

    const estudiante = rowsEstudiante[0];
    if (email == estudiante.correoInstitucional) {
      //Correos coinciden, crear nuvea clave
      const nuevaClave = Math.random()
        .toString(36)
        .substring(7);
      //Actualizar clave
      await pool.query(
        'UPDATE usuario SET claveUsuario = (aes_encrypt("' +
        nuevaClave +
        '","' +
        nuevaClave +
        '")) WHERE pkIdUsuario=' +
        fkIdUsuario +
        ";"
      );
      //Enviar correo con la clave
      contentHTML = `
        <h1>Estudiante, su nueva clave es</h1>
        <p>${nuevaClave}</p>
  
    `;
      //Configurar Emisor
      let emisor = nodemailer.createTransport({
        host: "mail.lamegaplaza.com",
        port: 587,
        secure: false,
        auth: {
          user: "prami@lamegaplaza.com",
          pass: "pramipassprami"
        },
        tls: {
          rejectUnauthorized: false
        }
      });

      //configurar Receptor
      const receptor = {
        from: '"Prami" <prami@lamegaplaza.com>', // sender address,
        to: email,
        subject: "Recuperar contraseña",
        // text: 'Contenido'
        html: contentHTML
      };
      //Enviar correo
      let info = await emisor.sendMail(receptor);

      console.log("Message sent: %s", info.messageId);
      // Message sent: <b658f8ca-6296-ccf4-8306-87d57a0b4321@example.com>

      // Preview only available when sending through an Ethereal account
      console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
      // Preview URL: https://ethereal.email/message/WaQKMgKddxQDoou...

      req.flash(
        "success",
        "Datos enviados, por favor revise su correo electrónico"
      );
      res.redirect("/estudiante/index");
    } else {
      //Correos no coinciden
      req.flash("message", "CÓDIGO y/o CORREO incorrectos");
      res.redirect("/estudiante/index");
    }
  } catch (error) {
    console.log("error recuperando clave: ", error);
    res.redirect("/");
  }
});

//Subir foto de perfil

const storage = multer.diskStorage({
  destination: path.join(__dirname, '../public/uploads'),
  filename: (req, file, cb) => {
    cb(null, uuid() + path.extname(file.originalname));
  }
});

const subirFoto = multer({
  storage,
  fileFilter: function (req, file, cb) {

    try {
      var filetypes = /jpg|jpeg|png|webp/;
      var mimetype = filetypes.test(file.mimetype);
      var extname = filetypes.test(path.extname(file.originalname).toLowerCase());

      if (mimetype && extname) {
        return cb(null, true);
      }
      cb("Error: Solo se permiten archivos con extensión: - " + filetypes);
    } catch (error) {
      console.log(error);
    }
  },
  limits: { fileSize: 10000000 },
}).single("profileimg");

router.post('/subirFotoPerfil', esEstudiante, async (req, res) => {
  try {
    subirFoto(req, res, async (err) => {
      const idUsuario = req.session.passport.user;
      const rutaImg = req.file.filename;
      const imagen = { rutaImg };
      const insertImg = await pool.query("INSERT INTO imagen SET ?", [imagen]);
      const fkIdImg = insertImg.insertId;
      const usuario = { fkIdImg };
      await pool.query("UPDATE usuario SET ?  WHERE pkIdUsuario=? ", [usuario, idUsuario]);

      req.flash("success", "Foto cargada");
      res.redirect('/estudiante/index');
    });
  } catch (error) {
    console.log(error);
    req.flash("message", "Error procesando imagen");
    res.redirect('/estudiante/index');
  }
});

//Agregar informe

const agregarInforme = multer({
  storage,
  fileFilter: function (req, file, cb) {

    var filetypes = /pdf|/;
    var mimetype = filetypes.test(file.mimetype);
    var extname = filetypes.test(path.extname(file.originalname).toLowerCase());

    if (mimetype && extname) {
      return cb(null, true);
    }
    cb("Error: Solo se permiten archivos con extensión: - " + filetypes);
  },
  limits: { fileSize: 10000000 },
}).single("informefile");

router.post('/agregarInforme/:id', esEstudiante, async (req, res) => {

  try {
    agregarInforme(req, res, async (err) => {
      const{id}=req.params;
      const idUsuario = req.session.passport.user;
      const fechaActual = new Date();

      const rowsEstudiante = await pool.query("SELECT pfkCodigoEstudiante FROM estudiante WHERE fkIdUsuario=?", [idUsuario]);

      const rutaInforme = req.file.filename;
      const nombreInforme = req.file.originalname.split(".")[0];
      const fkCodigoEstudiante = rowsEstudiante[0].pfkCodigoEstudiante;
      const fechaSubida = fechaActual.getFullYear() + "-" + (fechaActual.getMonth() + 1) + "-" + fechaActual.getDate();
      const informe = { nombreInforme, rutaInforme, fechaSubida };
      const insertInforme=await pool.query("INSERT INTO informe SET ?", [informe]);
      const informeEstudiante={
        fkIdEstudianteGrupo:req.session.pkIdEstudianteGrupo,
        fkIdInforme:insertInforme.insertId,
        numeroInforme:id,
        calificacion:0,
        comentarioCoordinador:""
      };
      await pool.query("INSERT INTO informeestudiante SET ?",[informeEstudiante]);

      req.flash("success", "Informe cargado");
      res.redirect('/estudiante/index');
    });
  } catch (error) {
    console.log(error);
    req.flash("message", "Error procesando archivo");
    res.redirect('/estudiante/index');
  }
});

//Ver informe
router.get("/informe/:id", esEstudiante, async (req, res) => {
  try {
    const { id } = req.params;
    const rowsInforme = await pool.query("SELECT informeestudiante.calificacion,informeestudiante.comentarioCoordinador,informe.rutaInforme, informe.fechaSubida FROM estudiantegrupo INNER JOIN grupo ON grupo.pkIdGrupo=estudianteGrupo.fkIdGrupo INNER JOIN informeestudiante ON informeestudiante.fkIdEstudianteGrupo=estudiantegrupo.pkIdEstudianteGrupo INNER JOIN informe ON informe.pkIdInforme=informeestudiante.fkIdInforme WHERE informeestudiante.numeroInforme= ? AND estudiantegrupo.fkCodigoEstudiante=? AND grupo.semestre=?", [id, req.session.codigoEstudiante, req.session.semestreActual]);
    var informe = rowsInforme[0];
    
    const nombreInforme = "Informe " + id;
    if (rowsInforme.length > 0) {
      informe.nombreInforme = nombreInforme;
      informe.numeroInforme = id;
    }
    var rowInforme=[informe];
    if (rowsInforme.length==0) {
      rowInforme=[];
    }

    console.log("objeto informe ",informe);
    res.render("estudiante/informe", { rowInforme,id});
  } catch (error) {
    console.log(error);
    req.flash("message", "Error");
    res.redirect('/estudiante/index');
  }
});

//Agregar hoja de vida
router.get("/subirHojaVida", (req, res) => {
  res.render("estudiante/subirHojaVida");
});

const agregarHojaDeVida = multer({
  storage,
  fileFilter: function (req, file, cb) {

    var filetypes = /pdf|pdf/;
    var mimetype = filetypes.test(file.mimetype);
    var extname = filetypes.test(path.extname(file.originalname).toLowerCase());

    if (mimetype && extname) {
      return cb(null, true);
    }
    cb("Error: Solo se permiten archivos con extensión: - " + filetypes);
  },
  limits: { fileSize: 10000000 },
}).single("profilehojavida");

router.post('/subirHojaVida', esEstudiante, async (req, res) => {

  try {
    agregarHojaDeVida(req, res, async (err) => {

      const idUsuario = req.session.passport.user;
      const rutaHojaVida = req.file.filename;
      const hojavida = { rutaHojaVida };
      const insertHoja = await pool.query("INSERT INTO hojavida SET ?", [hojavida]);

      const fkIdHojaVida = insertHoja.insertId;
      const usuario = { fkIdHojaVida };
      await pool.query("UPDATE estudiante SET ?  WHERE fkIdUsuario=? ", [usuario, idUsuario]);

      req.flash("success", "Hoja de vida cargada");
      res.redirect('/estudiante/index');
    });
  } catch (error) {
    console.log(error);
    req.flash("message", "Error procesando archivo");
    res.redirect('/estudiante/index');
  }
});

//Añadir Contrato
router.get("/crearContrato", esEstudiante, async (req, res) => {
  try {

    //buscar convenios 
    const rowsConvenio = await pool.query("SELECT pkIdConvenio,nombreConvenio FROM convenio");

    //buscar ciudades
    const rowsEmpresa = await pool.query("SELECT e.nombreEmpresa,e.nitEmpresa,e.pkIdEmpresa, c.descripcionCiudad FROM empresa e INNER JOIN ciudad c ON e.fkIdCiudad=c.pkIdCiudad");

    //enviar datos al gestor de plantilla

    res.render("estudiante/crearContrato", { rowsConvenio, rowsEmpresa });
  } catch (error) {
    console.log(error);
  }
});

router.post('/crearContrato', esEstudiante, async (req, res) => {

  try {
    //obtener datos formulario
    const { empresa, codConvenio, fechaInicio, fechaFinalizacion } = req.body;
    const rowsDirector = await pool.query("SELECT semestreActual FROM director");
    const semestre = rowsDirector[0].semestreActual;

    const rowsPkEstudianteGrupo = await pool.query("SELECT eg.pkIdEstudianteGrupo FROM estudiantegrupo eg INNER JOIN grupo g ON eg.fkIdGrupo=g.pkIdGrupo WHERE g.semestre=? AND eg.fkCodigoEstudiante=?", [semestre, req.session.codigoEstudiante]);
    const pkEstudianteGrupo = rowsPkEstudianteGrupo[0].pkIdEstudianteGrupo;
    const fechaActual = new Date();
    const fechaSubida = fechaActual.getFullYear() + "-" + (fechaActual.getMonth() + 1) + "-" + fechaActual.getDate();
    //guardar datos

    const contrato = {
      fkIdEmpresa: empresa,
      fkIdEstudianteGrupo: pkEstudianteGrupo,
      fkIdConvenio: codConvenio,
      fechaInicioPractica: fechaInicio,
      fechaFinPractica: fechaFinalizacion,
      fechaActualizacion: fechaSubida
    };

    await pool.query("INSERT INTO contrato SET ?", [contrato]);
    await pool.query("UPDATE estudiante SET estaEnPracticas=1 WHERE pfkCodigoEstudiante=?",[req.session.codigoEstudiante]);
    //redireccionar vista
    req.flash("success", "Contrato Añadido Correctamente");
    res.redirect('/estudiante/index');

  } catch (error) {
    console.log(error);
    res.redirect('/estudiante/index');
  }
});





module.exports = router;
