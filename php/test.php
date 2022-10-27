<?php require_once "setup.php";
   // echo $post;
   echo json_encode([
    "type" => "complete",
    "action" => [
        "action" => $json->action,
        "action2" => $json->action2,
        "action3" => $json->action3
    ]
]);
?>