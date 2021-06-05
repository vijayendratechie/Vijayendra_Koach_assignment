-- MySQL dump 10.13  Distrib 8.0.25, for macos11 (x86_64)
--
-- Host: localhost    Database: customerChat
-- ------------------------------------------------------
-- Server version	8.0.25

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `chatHistory`
--

DROP TABLE IF EXISTS `chatHistory`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `chatHistory` (
  `id` int NOT NULL AUTO_INCREMENT,
  `sourceUserId` int NOT NULL,
  `destUserId` int NOT NULL,
  `message` varchar(255) COLLATE utf8mb4_bin DEFAULT NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `index_name` (`id`),
  UNIQUE KEY `id` (`id`),
  KEY `sourceUserId` (`sourceUserId`),
  KEY `destUserId` (`destUserId`),
  CONSTRAINT `chathistory_ibfk_1` FOREIGN KEY (`sourceUserId`) REFERENCES `users` (`id`),
  CONSTRAINT `chathistory_ibfk_2` FOREIGN KEY (`destUserId`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=19 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `chatHistory`
--

LOCK TABLES `chatHistory` WRITE;
/*!40000 ALTER TABLE `chatHistory` DISABLE KEYS */;
INSERT INTO `chatHistory` VALUES (2,9,12,'vijju->staff1-1','2021-06-04 19:47:11'),(3,12,9,'staff1->vijju-1','2021-06-04 19:47:32'),(4,9,12,'vijju->staff1-2','2021-06-04 19:47:36'),(5,12,9,'staff1->vijju-2','2021-06-04 19:47:42'),(6,12,10,'staff1->kuku-1','2021-06-04 19:48:38'),(9,12,9,'staff1->vijju-3','2021-06-05 07:42:27'),(15,9,12,'vijju->staff1-3','2021-06-05 09:14:29'),(16,12,9,'staff1->vijju-4','2021-06-05 11:32:06'),(17,9,12,'vijju->staff1-4','2021-06-05 11:33:16'),(18,12,9,'staff1->vijju-5','2021-06-05 11:33:36');
/*!40000 ALTER TABLE `chatHistory` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `products`
--

DROP TABLE IF EXISTS `products`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `products` (
  `productId` int NOT NULL,
  `productName` varchar(255) NOT NULL,
  PRIMARY KEY (`productId`),
  UNIQUE KEY `productName` (`productName`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `products`
--

LOCK TABLES `products` WRITE;
/*!40000 ALTER TABLE `products` DISABLE KEYS */;
INSERT INTO `products` VALUES (111,'product1'),(222,'product2'),(333,'product3');
/*!40000 ALTER TABLE `products` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sessions`
--

DROP TABLE IF EXISTS `sessions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sessions` (
  `session_id` varchar(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `expires` int unsigned NOT NULL,
  `data` text CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  PRIMARY KEY (`session_id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sessions`
--

LOCK TABLES `sessions` WRITE;
/*!40000 ALTER TABLE `sessions` DISABLE KEYS */;
INSERT INTO `sessions` VALUES ('_IHMfnWOZnZCZlCfdHFGN223rC8eianu',1622915627,'{\"cookie\":{\"originalMaxAge\":null,\"expires\":null,\"httpOnly\":true,\"path\":\"/\"},\"passport\":{\"user\":{\"user_id\":9}}}'),('e46ewcxLxNc7_iqkReBgl-6kFPpHfGyg',1623001683,'{\"cookie\":{\"originalMaxAge\":null,\"expires\":null,\"httpOnly\":true,\"path\":\"/\"},\"passport\":{\"user\":{\"user_id\":12}}}');
/*!40000 ALTER TABLE `sessions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `userProductAssoc`
--

DROP TABLE IF EXISTS `userProductAssoc`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `userProductAssoc` (
  `userId` int DEFAULT NULL,
  `productId` int DEFAULT NULL,
  KEY `userId` (`userId`),
  KEY `productId` (`productId`),
  CONSTRAINT `userproductassoc_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `users` (`id`),
  CONSTRAINT `userproductassoc_ibfk_2` FOREIGN KEY (`productId`) REFERENCES `products` (`productId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `userProductAssoc`
--

LOCK TABLES `userProductAssoc` WRITE;
/*!40000 ALTER TABLE `userProductAssoc` DISABLE KEYS */;
INSERT INTO `userProductAssoc` VALUES (9,111),(9,333),(10,111);
/*!40000 ALTER TABLE `userProductAssoc` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `username` varchar(255) NOT NULL,
  `name` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `confirm` int NOT NULL,
  `email` varchar(255) NOT NULL,
  `gid` varchar(255) NOT NULL,
  `type` enum('user','staff') NOT NULL,
  `userImageRef` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`)
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (9,'vijju','vijay','vijju',2,'vijayendrapagare05@gmail.com','107246441159792084962','user',NULL),(10,'kuku','kuku','kuku',2,'kuku@123.com','0','user',NULL),(11,'bhate','bhate','bhate',2,'bhate@123.com','0','user',NULL),(12,'staff1','staff1','staff1',2,'staff1@gmail.com','0','staff',NULL);
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2021-06-05 23:35:31
