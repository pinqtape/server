<?php require_once "setup.php";

$check_email = R::count('users', 'email = ?', array($json->email));

echo json_encode([
    "type" => "ERROR",
    "action" => "nedostupno"
]);

// if ($check_email == 0) { // если такого email не существует

//     $check_nickname = R::count('users', 'nickname = ?', array($json->nickname));

//     if ($check_nickname == 0) { // если такого nickname не существует 
//         $user = R::dispense('users');
//         $user->email = $json->email;
//         $user->password = password_hash($json->password, PASSWORD_DEFAULT);
//         $user->nickname = $json->nickname;
//         $user->IP = ip2long(getenv('REMOTE_ADDR'));
    
//         R::store($user);
//         echo json_encode([
//             "type" => "complete",
//             "action" => "registration was successful"
//         ]);
//     } else {
//         echo json_encode([
//             "type" => "ERROR",
//             "action" => "nickname is busy"
//         ]);
//     };

// } else {
//     echo json_encode([
//         "type" => "ERROR",
//         "action" => "email is busy"
//     ]);
// };

?>