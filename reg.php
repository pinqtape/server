<?php require_once "setup.php";

// echo json_encode([
//     "type" => "ERROR",
//     "action" => "no access"
// ]);

$check_email = R::count('users', 'email = ?', array($json->email));
if (!$check_email) { // если такого email не существует
    $check_nick = R::count('users', 'nick = ?', array($json->nick));
    if (!$check_nick) { // если такого nickname не существует 
        $user = R::dispense('users');
        $user->email = $json->email;
        $user->pass = password_hash($json->pass, PASSWORD_DEFAULT);
        $user->nick = $json->nick;
        // $user->adres = ip2long(getenv('REMOTE_ADDR'));
    
        R::store($user);
        echo json_encode([
            "type" => "reg_complete",
            "action" => "registration was successful"
        ]);
    } else {
        echo json_encode([
            "type" => "ERROR",
            "action" => "nickname is busy"
        ]);
    };

} else {
    echo json_encode([
        "type" => "ERROR",
        "action" => "email is busy"
    ]);
};

?>