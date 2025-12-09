export function getRaces() {
    return fetch('https://api.goodstone.space/api/v1/race/all')
    //return fetch('http://localhost:8080/api/v1/race/all')
    .then(res => res.json())
    .then(data => {
        return data;
    })
    .catch(err => {
        console.error(err);
        //alert("Server under maintainance");
    });
}

export function getTemplates(race) {
    return fetch(`https://api.goodstone.space/api/v1/playerTemplate/${race}/template`)
    //return fetch(`http://localhost:8080/api/v1/playerTemplate/${race}/template`)
    .then(res => res.json())
    .then(data => {
        return data;
    })
    .catch(err => {
        console.error(err);
        //alert("Server under maintainance");
    });
}