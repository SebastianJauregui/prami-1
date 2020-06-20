
CREATE TABLE convenio (
                pkIdConvenio BIGINT NOT NULL,
                nombreConvenio VARCHAR(50) NOT NULL,
                descripcionConvenio VARCHAR(255) NOT NULL,
                PRIMARY KEY (pkIdConvenio)
);


CREATE TABLE grupo (
                pkIdGrupo BIGINT AUTO_INCREMENT NOT NULL,
                nombreGrupo VARCHAR(15) NOT NULL,
                semestre INT NOT NULL,
                PRIMARY KEY (pkIdGrupo)
);


CREATE TABLE preregistro (
                pkCodigoEstudiante INT NOT NULL,
                nombresEstudiante VARCHAR(50) NOT NULL,
                apellidosEstudiante VARCHAR(50) NOT NULL,
                fechaPreregistro VARCHAR(10) NOT NULL,
                fkIdGrupo BIGINT NOT NULL,
                PRIMARY KEY (pkCodigoEstudiante)
);


CREATE TABLE hojaVida (
                pkIdHojaVida BIGINT AUTO_INCREMENT NOT NULL,
                rutaHojaVida VARCHAR(255) NOT NULL,
                PRIMARY KEY (pkIdHojaVida)
);


CREATE TABLE imagen (
                pkIdImg BIGINT AUTO_INCREMENT NOT NULL,
                rutaImg VARCHAR(255) NOT NULL,
                PRIMARY KEY (pkIdImg)
);


CREATE TABLE ciudad (
                pkIdCiudad BIGINT AUTO_INCREMENT NOT NULL,
                descripcionCiudad VARCHAR(50) NOT NULL,
                PRIMARY KEY (pkIdCiudad)
);


CREATE TABLE usuario (
                pkIdUsuario BIGINT AUTO_INCREMENT NOT NULL,
                cedulaUsuario VARCHAR(15),
                nombreUsuario VARCHAR(50) NOT NULL,
                apellidoUsuario VARCHAR(50) NOT NULL,
                claveUsuario VARCHAR(200) NOT NULL,
                fkIdImg BIGINT,
                correoUsuario VARCHAR(50) NOT NULL,
                telefonoUsuario VARCHAR(20) NOT NULL,
                direccionUsuario VARCHAR(50) NOT NULL,
                fechaRegistro VARCHAR(10) NOT NULL,
                fechaNacimiento VARCHAR(10) NOT NULL,
                PRIMARY KEY (pkIdUsuario)
);


CREATE TABLE director (
                codigoDirector INT NOT NULL,
                fkIdUsuario BIGINT NOT NULL,
                semestreActual INT,
                PRIMARY KEY (codigoDirector)
);


CREATE TABLE estudiante (
                pfkCodidoEstudiante INT NOT NULL,
                fkIdHojaVida BIGINT,
                estaEnPracticas BOOLEAN NOT NULL,
                descripcionPersonalizada VARCHAR(255),
                edadEstudiante SMALLINT NOT NULL,
                semestreEstudiante SMALLINT NOT NULL,
                correoInstitucional VARCHAR(50) NOT NULL,
                pkIdUsuario BIGINT NOT NULL,
                PRIMARY KEY (pfkCodidoEstudiante)
);


CREATE TABLE contrato (
                pkIdContrato BIGINT NOT NULL,
                nitEmpresa VARCHAR(50) NOT NULL,
                nombreEmpresa VARCHAR(50) NOT NULL,
                fkIdCiudad BIGINT NOT NULL,
                direccionEmpresa VARCHAR(100) NOT NULL,
                fkCodidoEstudiante INT NOT NULL,
                fkIdConvenio BIGINT NOT NULL,
                fechaInicioPractica VARCHAR(10) NOT NULL,
                fechaFinPractica VARCHAR(10) NOT NULL,
                fechaActualizacion VARCHAR(10) NOT NULL,
                PRIMARY KEY (pkIdContrato)
);


CREATE TABLE informe (
                pkIdInforme BIGINT AUTO_INCREMENT NOT NULL,
                rutaInforme VARCHAR(255) NOT NULL,
                pfkCodidoEstudiante INT NOT NULL,
                fechaSubida VARCHAR(10) NOT NULL,
                PRIMARY KEY (pkIdInforme)
);


CREATE TABLE estudianteGrupo (
                pkIdEstudianteGrupo BIGINT AUTO_INCREMENT NOT NULL,
                fkIdGrupo BIGINT NOT NULL,
                pfkCodidoEstudiante INT NOT NULL,
                PRIMARY KEY (pkIdEstudianteGrupo)
);


ALTER TABLE contrato ADD CONSTRAINT convenio_contrato_fk
FOREIGN KEY (fkIdConvenio)
REFERENCES convenio (pkIdConvenio)
ON DELETE RESTRICT
ON UPDATE CASCADE;

ALTER TABLE estudianteGrupo ADD CONSTRAINT grupo_estudiantegrupo_fk
FOREIGN KEY (fkIdGrupo)
REFERENCES grupo (pkIdGrupo)
ON DELETE RESTRICT
ON UPDATE CASCADE;

ALTER TABLE preregistro ADD CONSTRAINT grupo_preregistro_fk
FOREIGN KEY (fkIdGrupo)
REFERENCES grupo (pkIdGrupo)
ON DELETE RESTRICT
ON UPDATE CASCADE;

ALTER TABLE estudiante ADD CONSTRAINT preregistro_estudiante_fk
FOREIGN KEY (pfkCodidoEstudiante)
REFERENCES preregistro (pkCodigoEstudiante)
ON DELETE RESTRICT
ON UPDATE CASCADE;

ALTER TABLE estudiante ADD CONSTRAINT hojavida_estudiante_fk
FOREIGN KEY (fkIdHojaVida)
REFERENCES hojaVida (pkIdHojaVida)
ON DELETE RESTRICT
ON UPDATE CASCADE;

ALTER TABLE usuario ADD CONSTRAINT imagen_usuario_fk
FOREIGN KEY (fkIdImg)
REFERENCES imagen (pkIdImg)
ON DELETE RESTRICT
ON UPDATE CASCADE;

ALTER TABLE contrato ADD CONSTRAINT ciudad_contrato_fk
FOREIGN KEY (fkIdCiudad)
REFERENCES ciudad (pkIdCiudad)
ON DELETE RESTRICT
ON UPDATE CASCADE;

ALTER TABLE estudiante ADD CONSTRAINT usuario_estudiante_fk
FOREIGN KEY (pkIdUsuario)
REFERENCES usuario (pkIdUsuario)
ON DELETE RESTRICT
ON UPDATE CASCADE;

ALTER TABLE director ADD CONSTRAINT usuario_director_fk
FOREIGN KEY (fkIdUsuario)
REFERENCES usuario (pkIdUsuario)
ON DELETE RESTRICT
ON UPDATE CASCADE;

ALTER TABLE estudianteGrupo ADD CONSTRAINT estudiante_estudiantegrupo_fk
FOREIGN KEY (pfkCodidoEstudiante)
REFERENCES estudiante (pfkCodidoEstudiante)
ON DELETE RESTRICT
ON UPDATE CASCADE;

ALTER TABLE informe ADD CONSTRAINT estudiante_informe_fk
FOREIGN KEY (pfkCodidoEstudiante)
REFERENCES estudiante (pfkCodidoEstudiante)
ON DELETE RESTRICT
ON UPDATE CASCADE;

ALTER TABLE contrato ADD CONSTRAINT estudiante_contrato_fk
FOREIGN KEY (fkCodidoEstudiante)
REFERENCES estudiante (pfkCodidoEstudiante)
ON DELETE RESTRICT
ON UPDATE CASCADE;
