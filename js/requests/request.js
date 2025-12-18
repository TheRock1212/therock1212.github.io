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

export function getCompetitions() {
    return fetch(`https://api.goodstone.space/api/v1/league/leagues`)
    //return fetch(`http://localhost:8080/api/v1/league/leagues`)
    .then(res => res.json())
    .then(data => {
        return data
    })
    .catch(err => {
        console.log(err);
    });
}

export function getPDF(team) {
    //return fetch(`http://localhost:8080/api/v1/team/pdf`, {
    return fetch(`https://api.goodstone.space/api/v1/team/pdf`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: team
    })
    .then(r => r.blob())
    .then(blob => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "roster.pdf";
        a.click();
        URL.revokeObjectURL(url);
    });
}