<?php require_once "setup.php";

switch($json->type) {
        case "add_kill_dead":
            // who kill
            add_info($json->who_kill, "kills", 1);
            add_info($json->who_kill, "money", $json->mnojitel);
            add_exp($json->who_kill, $json->mnojitel);

            // who dead
            add_info($json->who_dead, "deaths", 1);
        break;

        case "add_dead":
            add_info($json->who_dead, "deaths", 1);
            sub_info($json->who_dead, "money", 3);
        break;

        case "win_tour":
            $obj = $json->team_win;
            foreach ($obj as $user => $value) { // key = id, value = bet
                add_info($user, "tours", 1);
                foreach ($value as $key => $value) { // key = money  or cash, value = value
                    add_info($user, $key, $value * 1.8);
                };
            };
        break;

        case "set_json":
            $user = R::load('users', 42);
            $data = json_decode($user->weapon, true);
            $data["GUCCI"] = "5000$";
            $user->weapon = json_encode($data);
            R::store(($user));
            echo json_encode($data);
        break;

        case "add_exp":
           add_exp($json->id, $json->exp);
        break;

        case "add_flag":
            add_info($json->who_flag, "flags", 1);
            add_exp($json->who_flag, 5);
            echo "ADD FLAG";
         break;

}             
function add_info($id, $to, $value) {
    $user = R::load('users', $id);
    $user->$to += floor($value);
    R::store(($user));
};

function sub_info ($id, $to, $value) {
    $user = R::load('users', $id);
    $user->$to -= $value;

    if ($user->$to < 0) $user->$to = 0;
    R::store(($user));
}

function add_exp($id, $value) {
    $user = R::load('users', $id);
    $check_lvl = R::load('lvl', $user->lvl);

    $user->exp += $value;
    if ($user->exp >= $check_lvl->exp) {
        $user->lvl += 1;
        $user->exp -= $check_lvl->exp;
        $user->money += 500;
    };
    R::store(($user));
};



?>