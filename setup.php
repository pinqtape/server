<?php 
header("Access-Control-Allow-Origin: *");
require_once "rb-mysql.php";
R::setup("mysql:host=localhost;dbname=base", "vayzer", "aranastay");
R::freeze(true);

if (!R::testConnection()) {
    exit("Нет подключение с  базой данных");
} 
else {
    // session_start();
    $post = file_get_contents("php://input");
    $json = json_decode($post, false);
};

// $user = R::findOne("users", "id = ?", array($_SESSION["user"]->id));


?>