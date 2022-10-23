-- phpMyAdmin SQL Dump
-- version 5.0.2
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1:3306
-- Generation Time: Oct 23, 2022 at 05:50 PM
-- Server version: 8.0.19
-- PHP Version: 7.4.5

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `base`
--

-- --------------------------------------------------------

--
-- Table structure for table `lvl`
--

CREATE TABLE `lvl` (
  `id` int UNSIGNED NOT NULL,
  `exp` int NOT NULL DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

--
-- Dumping data for table `lvl`
--

INSERT INTO `lvl` (`id`, `exp`) VALUES
(0, 250),
(1, 400),
(2, 550),
(3, 700),
(4, 850),
(5, 1000),
(6, 1150),
(7, 1300),
(8, 1450),
(9, 1600),
(10, 1750),
(11, 1900),
(12, 2050),
(13, 2200),
(14, 2350),
(15, 2500),
(16, 2650),
(17, 2800),
(18, 2950),
(19, 3100),
(20, 3250),
(21, 0),
(22, 0),
(23, 0),
(24, 0),
(25, 0),
(26, 0),
(27, 0),
(28, 0),
(29, 0),
(30, 0),
(31, 0),
(32, 0),
(33, 0),
(34, 0),
(35, 0),
(36, 0),
(37, 0),
(38, 0),
(39, 0),
(40, 0),
(41, 0),
(42, 0),
(43, 0),
(44, 0),
(45, 0),
(46, 0),
(47, 0),
(48, 0),
(49, 0),
(50, 0),
(51, 0),
(52, 0),
(53, 0),
(54, 0),
(55, 0),
(56, 0),
(57, 0),
(58, 0),
(59, 0),
(60, 0);

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int UNSIGNED NOT NULL,
  `email` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_520_ci DEFAULT NULL,
  `password` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_520_ci DEFAULT NULL,
  `nickname` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_520_ci DEFAULT NULL,
  `lvl` int NOT NULL DEFAULT '0',
  `exp` int NOT NULL DEFAULT '0',
  `money` int DEFAULT '0',
  `cash` int DEFAULT '0',
  `kills` int NOT NULL DEFAULT '0',
  `deaths` int NOT NULL DEFAULT '0',
  `tours` int NOT NULL DEFAULT '0',
  `weapon` json DEFAULT NULL,
  `clan` varchar(3) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_520_ci NOT NULL DEFAULT '',
  `IP` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_520_ci DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `email`, `password`, `nickname`, `lvl`, `exp`, `money`, `cash`, `kills`, `deaths`, `tours`, `weapon`, `clan`, `IP`) VALUES
(74, 'alexdamien23442@gmail.com', '$2y$10$PUxKwADVqvlodKDU1IAby.QGd0BbnnY71uXpMZye6i2nDPCWw1BJ.', 'daxak enjoyer (арбуз)\r\n', 0, 0, 0, 0, 0, 0, 0, NULL, 'oG', '0'),
(75, 'golddengold@vk.com', '$2y$10$Mac8/ElVSacaHi0f7HDM7uZAkXXcvLZBb/L3bzIVdYEb1t459ip86', 'Golden', 0, 0, 0, 0, 0, 0, 0, NULL, 'PoD', '0'),
(76, 'lilvayzerminaj@gmail.com', '$2y$10$uScNnBe3yg55kMChxw0KA.Q1X51YJ//6dIE/ryuKXy4SrZatQPoY6', 'analtoly', 0, 0, 0, 0, 0, 0, 0, NULL, '', '127.0.0.1'),
(77, 'fhe@kosir.com', '$2y$10$K8t6iyqwrvO/zQOx/0DWbewAtZGvcbohwiZl8y57npZEw61l2EcZy', 'kosir', 0, 0, 0, 0, 0, 0, 0, NULL, '', '0');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `lvl`
--
ALTER TABLE `lvl`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `lvl`
--
ALTER TABLE `lvl`
  MODIFY `id` int UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=61;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=78;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
