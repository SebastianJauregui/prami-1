-- phpMyAdmin SQL Dump
-- version 5.0.2
-- https://www.phpmyadmin.net/
--
-- Servidor: 127.0.0.1
-- Tiempo de generación: 26-05-2020 a las 23:25:52
-- Versión del servidor: 10.4.11-MariaDB
-- Versión de PHP: 7.4.4

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de datos: `pramiv2`
--

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `ciudad`
--

CREATE TABLE `ciudad` (
  `pkIdCiudad` bigint(20) NOT NULL,
  `descripcionCiudad` varchar(50) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `contrato`
--

CREATE TABLE `contrato` (
  `pkIdContrato` bigint(20) NOT NULL,
  `nitEmpresa` varchar(50) NOT NULL,
  `nombreEmpresa` varchar(50) NOT NULL,
  `fkIdCiudad` bigint(20) NOT NULL,
  `direccionEmpresa` varchar(100) NOT NULL,
  `fkCodidoEstudiante` int(11) NOT NULL,
  `fkIdConvenio` bigint(20) NOT NULL,
  `fechaInicioPractica` varchar(10) NOT NULL,
  `fechaFinPractica` varchar(10) NOT NULL,
  `fechaActualizacion` varchar(10) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `convenio`
--

CREATE TABLE `convenio` (
  `pkIdConvenio` bigint(20) NOT NULL,
  `nombreConvenio` varchar(50) NOT NULL,
  `descripcionConvenio` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `director`
--

CREATE TABLE `director` (
  `codigoDirector` int(11) NOT NULL,
  `fkIdUsuario` bigint(20) NOT NULL,
  `semestreActual` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Volcado de datos para la tabla `director`
--

INSERT INTO `director` (`codigoDirector`, `fkIdUsuario`, `semestreActual`) VALUES
(123, 6, 20201);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `estudiante`
--

CREATE TABLE `estudiante` (
  `pfkCodigoEstudiante` int(11) NOT NULL,
  `fkIdHojaVida` bigint(20) DEFAULT NULL,
  `estaEnPracticas` tinyint(1) NOT NULL,
  `descripcionPersonalizada` varchar(255) DEFAULT NULL,
  `edadEstudiante` smallint(6) NOT NULL,
  `semestreEstudiante` smallint(6) NOT NULL,
  `correoInstitucional` varchar(50) NOT NULL,
  `fkIdUsuario` bigint(20) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Volcado de datos para la tabla `estudiante`
--

INSERT INTO `estudiante` (`pfkCodigoEstudiante`, `fkIdHojaVida`, `estaEnPracticas`, `descripcionPersonalizada`, `edadEstudiante`, `semestreEstudiante`, `correoInstitucional`, `fkIdUsuario`) VALUES
(1151512, NULL, 0, NULL, 22, 9, 'enmanuelcamilomr@ufps.edu.co', 15);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `estudiantegrupo`
--

CREATE TABLE `estudiantegrupo` (
  `pkIdEstudianteGrupo` bigint(20) NOT NULL,
  `fkIdGrupo` bigint(20) NOT NULL,
  `fkCodigoEstudiante` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Volcado de datos para la tabla `estudiantegrupo`
--

INSERT INTO `estudiantegrupo` (`pkIdEstudianteGrupo`, `fkIdGrupo`, `fkCodigoEstudiante`) VALUES
(4, 1, 1151512);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `grupo`
--

CREATE TABLE `grupo` (
  `pkIdGrupo` bigint(20) NOT NULL,
  `nombreGrupo` varchar(15) NOT NULL,
  `semestre` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Volcado de datos para la tabla `grupo`
--

INSERT INTO `grupo` (`pkIdGrupo`, `nombreGrupo`, `semestre`) VALUES
(1, 'Grupo A', 20201),
(8, 'Grupo B', 20201);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `hojavida`
--

CREATE TABLE `hojavida` (
  `pkIdHojaVida` bigint(20) NOT NULL,
  `rutaHojaVida` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `imagen`
--

CREATE TABLE `imagen` (
  `pkIdImg` bigint(20) NOT NULL,
  `rutaImg` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `informe`
--

CREATE TABLE `informe` (
  `pkIdInforme` bigint(20) NOT NULL,
  `rutaInforme` varchar(255) NOT NULL,
  `nombreInforme` varchar(50) NOT NULL,
  `fkCodigoEstudiante` int(11) NOT NULL,
  `fechaSubida` varchar(10) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `preregistro`
--

CREATE TABLE `preregistro` (
  `pkCodigoEstudiante` int(11) NOT NULL,
  `nombresEstudiante` varchar(50) NOT NULL,
  `apellidosEstudiante` varchar(50) NOT NULL,
  `fechaPreregistro` varchar(10) NOT NULL,
  `fkIdGrupo` bigint(20) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Volcado de datos para la tabla `preregistro`
--

INSERT INTO `preregistro` (`pkCodigoEstudiante`, `nombresEstudiante`, `apellidosEstudiante`, `fechaPreregistro`, `fkIdGrupo`) VALUES
(1151504, 'joha sebá ', 'jaure malardo', '2020-5-25', 1),
(1151511, 'chucho alfred ', 'villa rojo', '2020-5-25', 1),
(1151512, 'emanue camil ', 'martin rodrigo', '2020-5-25', 1),
(2151504, 'joha sebá ', 'jaure malardo', '2020-5-25', 8),
(2151511, 'chucho alfred ', 'villa rojo', '2020-5-25', 8),
(2151512, 'emanue camil ', 'martin rodrigo', '2020-5-25', 8);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `sessions`
--

CREATE TABLE `sessions` (
  `session_id` varchar(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `expires` int(11) UNSIGNED NOT NULL,
  `data` text CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Volcado de datos para la tabla `sessions`
--

INSERT INTO `sessions` (`session_id`, `expires`, `data`) VALUES
('TXn_yV1QqBTdgIX2SN8iYclGSQZZ42Pi', 1590614092, '{\"cookie\":{\"originalMaxAge\":null,\"expires\":null,\"httpOnly\":true,\"path\":\"/\"},\"flash\":{\"error\":[\"Missing credentials\"]},\"tipoUsuario\":3,\"passport\":{}}');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `usuario`
--

CREATE TABLE `usuario` (
  `pkIdUsuario` bigint(20) NOT NULL,
  `cedulaUsuario` varchar(15) DEFAULT NULL,
  `nombreUsuario` varchar(50) NOT NULL,
  `apellidoUsuario` varchar(50) NOT NULL,
  `claveUsuario` blob NOT NULL,
  `fkIdImg` bigint(20) DEFAULT NULL,
  `correoUsuario` varchar(50) DEFAULT NULL,
  `telefonoUsuario` varchar(20) DEFAULT NULL,
  `direccionUsuario` varchar(50) DEFAULT NULL,
  `fechaRegistro` varchar(10) NOT NULL,
  `fechaNacimiento` varchar(10) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Volcado de datos para la tabla `usuario`
--

INSERT INTO `usuario` (`pkIdUsuario`, `cedulaUsuario`, `nombreUsuario`, `apellidoUsuario`, `claveUsuario`, `fkIdImg`, `correoUsuario`, `telefonoUsuario`, `direccionUsuario`, `fechaRegistro`, `fechaNacimiento`) VALUES
(6, NULL, 'Luis', 'Algo', 0x9c874142e85170322530714e319e81af, NULL, 'enmanuelcamilo9999@gmail.com', NULL, NULL, '2020-05-22', NULL),
(9, NULL, 'sebaj', 'jaure', '', NULL, NULL, NULL, NULL, '2020-05-24', NULL),
(15, '1090519133', 'emanue camil ', 'martin rodrigo', 0xf5bf6825c8868e1fc0cd824dfc83f83a, NULL, NULL, NULL, NULL, '2020-5-26', NULL);

--
-- Índices para tablas volcadas
--

--
-- Indices de la tabla `ciudad`
--
ALTER TABLE `ciudad`
  ADD PRIMARY KEY (`pkIdCiudad`);

--
-- Indices de la tabla `contrato`
--
ALTER TABLE `contrato`
  ADD PRIMARY KEY (`pkIdContrato`),
  ADD KEY `convenio_contrato_fk` (`fkIdConvenio`),
  ADD KEY `ciudad_contrato_fk` (`fkIdCiudad`),
  ADD KEY `estudiante_contrato_fk` (`fkCodidoEstudiante`);

--
-- Indices de la tabla `convenio`
--
ALTER TABLE `convenio`
  ADD PRIMARY KEY (`pkIdConvenio`);

--
-- Indices de la tabla `director`
--
ALTER TABLE `director`
  ADD PRIMARY KEY (`codigoDirector`),
  ADD KEY `usuario_director_fk` (`fkIdUsuario`);

--
-- Indices de la tabla `estudiante`
--
ALTER TABLE `estudiante`
  ADD PRIMARY KEY (`pfkCodigoEstudiante`),
  ADD KEY `hojavida_estudiante_fk` (`fkIdHojaVida`),
  ADD KEY `usuario_estudiante_fk` (`fkIdUsuario`);

--
-- Indices de la tabla `estudiantegrupo`
--
ALTER TABLE `estudiantegrupo`
  ADD PRIMARY KEY (`pkIdEstudianteGrupo`),
  ADD KEY `grupo_estudiantegrupo_fk` (`fkIdGrupo`),
  ADD KEY `estudiante_estudiantegrupo_fk` (`fkCodigoEstudiante`);

--
-- Indices de la tabla `grupo`
--
ALTER TABLE `grupo`
  ADD PRIMARY KEY (`pkIdGrupo`);

--
-- Indices de la tabla `hojavida`
--
ALTER TABLE `hojavida`
  ADD PRIMARY KEY (`pkIdHojaVida`);

--
-- Indices de la tabla `imagen`
--
ALTER TABLE `imagen`
  ADD PRIMARY KEY (`pkIdImg`);

--
-- Indices de la tabla `informe`
--
ALTER TABLE `informe`
  ADD PRIMARY KEY (`pkIdInforme`),
  ADD KEY `estudiante_informe_fk` (`fkCodigoEstudiante`);

--
-- Indices de la tabla `preregistro`
--
ALTER TABLE `preregistro`
  ADD PRIMARY KEY (`pkCodigoEstudiante`),
  ADD KEY `grupo_preregistro_fk` (`fkIdGrupo`);

--
-- Indices de la tabla `sessions`
--
ALTER TABLE `sessions`
  ADD PRIMARY KEY (`session_id`);

--
-- Indices de la tabla `usuario`
--
ALTER TABLE `usuario`
  ADD PRIMARY KEY (`pkIdUsuario`),
  ADD KEY `imagen_usuario_fk` (`fkIdImg`);

--
-- AUTO_INCREMENT de las tablas volcadas
--

--
-- AUTO_INCREMENT de la tabla `ciudad`
--
ALTER TABLE `ciudad`
  MODIFY `pkIdCiudad` bigint(20) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `estudiantegrupo`
--
ALTER TABLE `estudiantegrupo`
  MODIFY `pkIdEstudianteGrupo` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT de la tabla `grupo`
--
ALTER TABLE `grupo`
  MODIFY `pkIdGrupo` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT de la tabla `hojavida`
--
ALTER TABLE `hojavida`
  MODIFY `pkIdHojaVida` bigint(20) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `imagen`
--
ALTER TABLE `imagen`
  MODIFY `pkIdImg` bigint(20) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `informe`
--
ALTER TABLE `informe`
  MODIFY `pkIdInforme` bigint(20) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `usuario`
--
ALTER TABLE `usuario`
  MODIFY `pkIdUsuario` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=16;

--
-- Restricciones para tablas volcadas
--

--
-- Filtros para la tabla `contrato`
--
ALTER TABLE `contrato`
  ADD CONSTRAINT `ciudad_contrato_fk` FOREIGN KEY (`fkIdCiudad`) REFERENCES `ciudad` (`pkIdCiudad`) ON UPDATE CASCADE,
  ADD CONSTRAINT `convenio_contrato_fk` FOREIGN KEY (`fkIdConvenio`) REFERENCES `convenio` (`pkIdConvenio`) ON UPDATE CASCADE,
  ADD CONSTRAINT `estudiante_contrato_fk` FOREIGN KEY (`fkCodidoEstudiante`) REFERENCES `estudiante` (`pfkCodigoEstudiante`) ON UPDATE CASCADE;

--
-- Filtros para la tabla `director`
--
ALTER TABLE `director`
  ADD CONSTRAINT `usuario_director_fk` FOREIGN KEY (`fkIdUsuario`) REFERENCES `usuario` (`pkIdUsuario`) ON UPDATE CASCADE;

--
-- Filtros para la tabla `estudiante`
--
ALTER TABLE `estudiante`
  ADD CONSTRAINT `hojavida_estudiante_fk` FOREIGN KEY (`fkIdHojaVida`) REFERENCES `hojavida` (`pkIdHojaVida`) ON UPDATE CASCADE,
  ADD CONSTRAINT `preregistro_estudiante_fk` FOREIGN KEY (`pfkCodigoEstudiante`) REFERENCES `preregistro` (`pkCodigoEstudiante`) ON UPDATE CASCADE,
  ADD CONSTRAINT `usuario_estudiante_fk` FOREIGN KEY (`fkIdUsuario`) REFERENCES `usuario` (`pkIdUsuario`) ON UPDATE CASCADE;

--
-- Filtros para la tabla `estudiantegrupo`
--
ALTER TABLE `estudiantegrupo`
  ADD CONSTRAINT `estudiante_estudiantegrupo_fk` FOREIGN KEY (`fkCodigoEstudiante`) REFERENCES `estudiante` (`pfkCodigoEstudiante`) ON UPDATE CASCADE,
  ADD CONSTRAINT `grupo_estudiantegrupo_fk` FOREIGN KEY (`fkIdGrupo`) REFERENCES `grupo` (`pkIdGrupo`) ON UPDATE CASCADE;

--
-- Filtros para la tabla `informe`
--
ALTER TABLE `informe`
  ADD CONSTRAINT `estudiante_informe_fk` FOREIGN KEY (`fkCodigoEstudiante`) REFERENCES `estudiante` (`pfkCodigoEstudiante`) ON UPDATE CASCADE;

--
-- Filtros para la tabla `preregistro`
--
ALTER TABLE `preregistro`
  ADD CONSTRAINT `grupo_preregistro_fk` FOREIGN KEY (`fkIdGrupo`) REFERENCES `grupo` (`pkIdGrupo`) ON UPDATE CASCADE;

--
-- Filtros para la tabla `usuario`
--
ALTER TABLE `usuario`
  ADD CONSTRAINT `imagen_usuario_fk` FOREIGN KEY (`fkIdImg`) REFERENCES `imagen` (`pkIdImg`) ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
