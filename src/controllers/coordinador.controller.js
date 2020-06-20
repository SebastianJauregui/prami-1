const express = require("express");
const router = express.Router();

const passport = require("passport");
const pool = require("../database");
const { esCoordinador } = require("../lib/auth");
const helpers = require("../lib/helpers");
const nodemailer = require("nodemailer");
const path = require('path');
const multer = require('multer');
const fs = require('fs');
const uuid = require('uuid/v4');


// SIGNUP
router.get("/registro", (req, res) => {
  res.render("coordinador/registro");
});

router.post(
  "/registro",
  passport.authenticate("coordinador.registro", {
    successRedirect: "/coordinador/index",
    failureRedirect: "/coordinador/registro",
    failureFlash: true
  })
);

//SIGNIN
router.get("/login", (req, res) => {
  res.render("coordinador/login");
});

router.post("/login", (req, res, next) => {
  req.check("codigo", "Código es requerido").notEmpty();
  req.check("password", "Contraseña es requerida").notEmpty();

  const errors = req.validationErrors();
  if (errors.length > 0) {
    req.flash("message", errors[0].msg);
    res.redirect("/coordinador/login");
  }
  passport.authenticate("coordinador.login", {
    successRedirect: "/coordinador/index",
    failureRedirect: "/coordinador/login",
    failureFlash: true
  })(req, res, next);
});

router.get("/cerrarLogin", esCoordinador, (req, res) => {
  req.logOut();
  res.redirect("/");
});


//NEGOCIO

router.get("/index", esCoordinador, async(req, res) => {
  const rowsGrupo= await pool.query("SELECT grupo.nombreGrupo FROM coordinadorgrupo INNER JOIN grupo ON coordinadorgrupo.fkIdGrupo=grupo.pkIdGrupo WHERE coordinadorgrupo.pkIdCoordinadorGrupo=?",[req.session.pkIdCoordinadorGrupo]);
  const nombreGrupo= rowsGrupo[0].nombreGrupo;
  res.render("coordinador/index",{nombreGrupo});
});


router.get('/recuperarClave', (req, res) => {
  res.render('coordinador/recuperarClave');
});

router.post('/recuperarClave', async (req, res) => {
  try {
    const { codigo, email } = req.body;
    //Consultar si existe el codigo ingresado en la tabla del Coordinador
    const rowsCoordinador = await pool.query('SELECT fkIdUsuario,correoInstitucional FROM coordinador WHERE pfkCodigoCoordinador = ?', [codigo]);
    //Si la consulta arrojó 1 resultado...
    if (rowsCoordinador.length != 1) {
      throw "Existen varios coordinadores o ninguno asignados a un codigo";
    }
    const coordinador = rowsCoordinador[0];
    //Consultar si los correos coinciden
    if (coordinador.correoInstitucional != email) {
      throw "Los correos no coinciden";
    }
    //Correos coinciden, crear nuvea clave
    const nuevaClave = Math.random().toString(36).substring(7);
    //Actualizar clave
    await pool.query('UPDATE usuario SET claveUsuario = (aes_encrypt("' + nuevaClave + '","' + nuevaClave + '")) WHERE pkIdUsuario=' + coordinador.fkIdUsuario + ';');
    //Enviar correo con la clave
    contentHTML = `
          <h1>coordinador, su nueva clave es</h1>
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
    res.redirect('/coordinador/index');

  } catch (error) {
    console.log("error recuperando clave: ", error);
    req.flash('message', 'Código o correo incorrectos');
    res.redirect('/coordinador/index');
  }
});

router.get("/listadoEstudiantes", esCoordinador, async (req, res) => {
  try {
    const semestre = req.session.semestreActual;
    const rowsEstudiantes = await pool.query("SELECT estudiantegrupo.pkIdEstudianteGrupo, usuario.nombreUsuario,usuario.apellidoUsuario,estudiante.pfkCodigoEstudiante FROM coordinador INNER JOIN coordinadorgrupo ON coordinadorgrupo.fkCodigoCoordinador=coordinador.pfkCodigoCoordinador INNER JOIN grupo ON grupo.pkIdGrupo=coordinadorgrupo.fkIdGrupo INNER JOIN estudiantegrupo ON estudiantegrupo.fkIdGrupo=grupo.pkIdGrupo INNER JOIN estudiante ON estudiante.pfkCodigoEstudiante=estudiantegrupo.fkCodigoEstudiante INNER JOIN usuario ON usuario.pkIdUsuario= estudiante.fkIdUsuario WHERE coordinador.pfkCodigoCoordinador=? AND grupo.semestre=?", [req.session.codigoCoordinador, semestre]);
    res.render("coordinador/listadoEstudiantes", { rowsEstudiantes });
  } catch (error) {
    console.log(error);
    res.redirect("/coordinador/index");
  }
});

router.get("/informe/:id", esCoordinador, async (req, res) => {
  try {
    const {id}=req.params;
    const arrayEstudiante= id.split("-");
    const numeroInforme= arrayEstudiante[0];
    const pkIdEstudianteGrupo=arrayEstudiante[1];
    
    const rowsInforme= await pool.query("SELECT estudiante.pfkCodigoEstudiante,usuario.nombreUsuario,informe.rutaInforme,informe.fechaSubida,informeestudiante.calificacion, informeestudiante.comentarioCoordinador FROM informeestudiante INNER JOIN informe ON informeestudiante.fkIdInforme= informe.pkIdInforme INNER JOIN estudiantegrupo ON informeestudiante.fkIdEstudianteGrupo=estudiantegrupo.pkIdEstudianteGrupo INNER JOIN estudiante ON estudiantegrupo.fkCodigoEstudiante=estudiante.pfkCodigoEstudiante INNER JOIN usuario ON estudiante.fkIdUsuario=usuario.pkIdUsuario WHERE fkIdEstudianteGrupo=? AND numeroInforme=?",[pkIdEstudianteGrupo,numeroInforme]);
    const informe=rowsInforme[0];
    informe.vars=id;
    informe.numeroInforme=numeroInforme;
    res.render("coordinador/informe", {informe});
  } catch (error) {
    console.log(error);
    req.flash("message", "El estudiante aún no ha subido este informe");
    res.redirect("/coordinador/listadoEstudiantes");
  }
});

router.post("/editarinforme", esCoordinador, async (req, res) => {
  try {
    const {vars,comentarios,calificacion}=req.body;
    const arrayEstudiante= vars.split("-");
    const numeroInforme= arrayEstudiante[0];
    const pkIdEstudianteGrupo=arrayEstudiante[1];

    const datos={
      calificacion,
      comentarioCoordinador:comentarios
    }

    await pool.query("UPDATE informeestudiante SET ? WHERE fkIdEstudianteGrupo=? AND numeroInforme=? ",[datos,pkIdEstudianteGrupo,numeroInforme]);
    res.redirect("/coordinador/listadoEstudiantes");
  } catch (error) {
    console.log(error);
    res.redirect("/coordinador/index");
  }
});

module.exports = router;
