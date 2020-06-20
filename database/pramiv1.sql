
CREATE TABLE grupo (
                pkIdGrupo BIGINT AUTO_INCREMENT NOT NULL,
                nombreGrupo VARCHAR(15) NOT NULL,
                PRIMARY KEY (pkIdGrupo)
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
                pkCedulaUsuario BIGINT NOT NULL,
                nombreUsuario VARCHAR(50) NOT NULL,
                apellidoUsuario VARCHAR(50) NOT NULL,
                claseUsuario VARCHAR(200) NOT NULL,
                fkIdImg BIGINT NOT NULL,
                correoUsuario VARCHAR(50) NOT NULL,
                PRIMARY KEY (pkCedulaUsuario)
);


CREATE TABLE director (
                pkIdDirector BIGINT AUTO_INCREMENT NOT NULL,
                codigoDirector VARCHAR(15) NOT NULL,
                fkCedulaUsuario BIGINT NOT NULL,
                PRIMARY KEY (pkIdDirector)
);


CREATE TABLE estudiante (
                pkIdEstudiante BIGINT AUTO_INCREMENT NOT NULL,
                fkCedulaUsuario BIGINT NOT NULL,
                codigoEstudiante VARCHAR(15) NOT NULL,
                fkIdHojaVida BIGINT NOT NULL,
                estaEnPracticas BOOLEAN NOT NULL,
                PRIMARY KEY (pkIdEstudiante)
);


CREATE TABLE informe (
                pkIdInforme BIGINT AUTO_INCREMENT NOT NULL,
                rutaInforme VARCHAR(255) NOT NULL,
                fkIdEstudiante BIGINT NOT NULL,
                PRIMARY KEY (pkIdInforme)
);


CREATE TABLE estudianteGrupo (
                pkIdEstudianteGrupo BIGINT AUTO_INCREMENT NOT NULL,
                fkIdEstudiante BIGINT NOT NULL,
                fkIdGrupo BIGINT NOT NULL,
                PRIMARY KEY (pkIdEstudianteGrupo)
);


ALTER TABLE estudianteGrupo ADD CONSTRAINT grupo_estudiantegrupo_fk
FOREIGN KEY (fkIdGrupo)
REFERENCES grupo (pkIdGrupo)
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

ALTER TABLE estudiante ADD CONSTRAINT usuario_estudiante_fk
FOREIGN KEY (fkCedulaUsuario)
REFERENCES usuario (pkCedulaUsuario)
ON DELETE RESTRICT
ON UPDATE CASCADE;

ALTER TABLE director ADD CONSTRAINT usuario_director_fk
FOREIGN KEY (fkCedulaUsuario)
REFERENCES usuario (pkCedulaUsuario)
ON DELETE RESTRICT
ON UPDATE CASCADE;

ALTER TABLE estudianteGrupo ADD CONSTRAINT estudiante_estudiantegrupo_fk
FOREIGN KEY (fkIdEstudiante)
REFERENCES estudiante (pkIdEstudiante)
ON DELETE RESTRICT
ON UPDATE CASCADE;

ALTER TABLE informe ADD CONSTRAINT estudiante_informe_fk
FOREIGN KEY (fkIdEstudiante)
REFERENCES estudiante (pkIdEstudiante)
ON DELETE RESTRICT
ON UPDATE CASCADE;
