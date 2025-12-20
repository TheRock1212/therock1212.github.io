import { getRaces } from "./requests/request.js";
import { getTemplates } from "./requests/request.js";
import { getCompetitions } from "./requests/request.js";
import { getPDF } from "./requests/request.js";
import { Team } from "./classes/team.js"; 
import { Player } from "./classes/player.js";
import { addTeam } from "./requests/request.js";

let comp;
let races;
let templates;
let selectedRace;
let team;

window.norseClause = function () { 
    if(selectedRace && selectedRace['name'] === "Norse") {
        if(document.querySelector("#league").value == "Chaos Clash") {
            document.querySelector("#special").innerHTML = selectedRace['special'];
            team.special = selectedRace['special'];
        } else {
            document.querySelector("#special").innerHTML = "";
            team.special = null;
        }
    }
}

function setLeague() {
    norseClause();
    const elem = document.querySelector("#league");
    if(elem.value == "Select") {
        team.league = null;
    } else {
        team.league = elem.value;
    }
    console.log(team);
}

function setSpecial() {
    const elem = document.querySelector("#chaos");
    if(elem.value == "Select") {
        team.special = null;
    } else {
        team.special = elem.value;
    }
    console.log(team);
}

async function init() {
    
    races = await getRaces();
    comp = await getCompetitions();
    let select = document.getElementById("race");
    races.forEach(r => {
        select.add(new Option(r['name'], r['id']));
    });
    select = document.querySelector("#rosters");
    comp.forEach(r => {
        select.add(new Option(r['name'], r['id']));
    });

}

async function setRaces() {
    const noInput = document.getElementById('race').value === "0";
    reset();
    if(noInput) {
        selectedRace = null;
        return;
    }
    team = new Team(1050, Number(document.getElementById('race').value), document.querySelector("#rosters").value);
    selectedRace = races.find(r => r['id'] == document.getElementById('race').value);
    //Cambio apo
    const apo = document.getElementById("apo");
    apo.innerHTML = selectedRace['apothecary'] ? "<input type='checkbox' id='apothecary' name='apo' >" : "No";
    if(selectedRace['apothecary']) {
        apo.querySelector("#apothecary").addEventListener("change", setStaff);
    }

    
    //Aggiungo league
    const last = document.querySelector("#last_line");
    let html = `<th>League:</th><td colspan="6">`;
    if(selectedRace['league'].includes(" or ")) {
        const leagues = selectedRace['league'].split(" or ");
        html += `<select name="league" id="league">`;
        html += `<option value="Select">Select</option>`;
        leagues.forEach(l => {
            html += `<option value="${l}">${l}</option>`;
        });
        html += `</select></td>`;

    } else {
        html += `${selectedRace['league']}`;
    }
    //Aggiungo special rules
    html += `<th colspan="3">Special Rules:</th><td colspan="3" id="special">`
    if(selectedRace['special'].includes("Favoured of...")) {
        html += `<select id="chaos">`;
        const match = selectedRace['special'].match(/\(([^)]+)\)/);
        html += `<option value="Select">Select</option>`;
        if(match[1] == "ANY") {
            html += `<option value="Favoured of Hashut">Favoured of Hashut</option>`;
        }
        html += `<option value="Favoured of Khorne">Favoured of Khorne</option>`;
        html += `<option value="Favoured of Nurgle">Favoured of Nurgle</option>`;
        html += `<option value="Favoured of Slaanesh">Favoured of Slaanesh</option>`;
        html += `<option value="Favoured of Tzeentch">Favoured of Tzeentch</option>`;
        html += `<option value="Favoured of Undivided">Favoured of Undivided</option>`;
        html += `</select>`;
    } else {
        if(selectedRace['name'] != "Norse") {
            html += `${selectedRace['special']}`;
        }
    }
    html += `</td>`;

    last.innerHTML = html;
    if(selectedRace['league'].includes(" or ")) {
        last.querySelector("#league").addEventListener("change", setLeague);
    }
    if(selectedRace['special'].includes("Favoured of...")) {
        last.querySelector("#chaos").addEventListener("change", setSpecial);
    }
    
    const rr = document.getElementById("rr_test");
    rr.textContent = `Reroll: ${selectedRace['reroll']} k`;
    templates = await getTemplates(selectedRace['id']);
    const combos = document.getElementsByClassName('templates');
    for (const c of combos) {
        c.innerHTML = "";
        c.add(new Option('Select', '0'));
        templates.forEach(tem => {
            c.add(new Option(tem['position'], tem['id']))
        });
        const index = c.id.split("_")[1];
        clearForm(index);
    };

    if(selectedRace['special'].includes("Team Captain")) {
        const last = document.getElementById("last_line");
        last.insertAdjacentHTML("afterend", `
            <tr id="captain_row">
                <th>Team Captain</th>
                <td colspan="6">
                    <select name="captain" id="captain"></select>
                </td>
            </tr>
        `);
    } else {
        const cap = document.querySelector("#captain_row");
        if(cap) {
            cap.remove();
        }
    }
}

function setTemplate(e) {
    const select = e.target;
    const index = select.id.split("_")[1];
    let selectedTemplate;
    if(select.value == 0) {       
        if(team.players.has(index)) {
            selectedTemplate = templates.find(t => t['id'] == team.players.get(index).id);
            team.treasury += selectedTemplate.cost;
            if(!selectedRace['special'].includes("Low Cost Lineman")) {
                team.value -= selectedTemplate.cost;
            }
            team.players.delete(index);
            document.querySelector("#treasury").textContent = team.treasury;
        }
        selectedTemplate = null;
        clearForm(index);
    } else {
        selectedTemplate = templates.find(t => t['id'] == select.value);
        let count = 1;
        const combos = document.querySelectorAll(".templates");
        combos.forEach((c, i) => {
            if(i != index) {
                if(combos[i].value == selectedTemplate['id'])
                    count++;
            }
        });
        if(count > selectedTemplate['maxQty']) {
            alert(`You can have only ${selectedTemplate['maxQty']} for ${selectedTemplate['position']}`);
            select.value = team.players.has(index) ? team.players.get(index).id : 0;
            return;
        }
        //Controllo Big Guy
        if(selectedTemplate['bigGuy']) {
            if(selectedRace['name'] == "Chaos Renegade" || selectedRace['name'] == "Chaos Chosen" 
                || selectedRace['name'] == "Old World Alliance" || selectedRace['name'] == "Underworld Denizens") {
                let big = 0;
                if(selectedTemplate['bigGuy']) {
                    big++;
                }
                team.players.forEach((p, i) => {
                    const template = templates.find(t => t['id'] == p.id);
                    if(template['bigGuy'] && i != index) {
                        big++;
                    }
                });
                console.log(big);
                if((selectedRace['name'] == "Chaos Renegade" && big > 3)) {
                    alert(`Max number of Big Guy: 3!`);
                    select.value = team.players.has(index) ? team.players.get(index).id : 0;
                    return;
                }
                if((selectedRace['name'] != "Chaos Renegade" && big > 1)) {
                    alert(`Max number of Big Guy: 1!`);
                    select.value = team.players.has(index) ? team.players.get(index).id : 0;
                    return;
                }
            }
        }
        const treasury = team.treasury - selectedTemplate['cost'];
        if(treasury < 0) {
            alert(`MAX Treasury 1050k`);
            select.value = team.players.has(index) ? team.players.get(index).id : 0;
            return;
        }
        if(team.players.has(index)) {
            team.treasury += templates.find(t => t['id'] == team.players.get(index).id).cost;
            if(!selectedRace['special'].includes("Low Cost Lineman")) {
                team.value -= templates.find(t => t['id'] == team.players.get(index).id).cost;
            }
            team.players.delete(index);
        }
        team.treasury -= selectedTemplate['cost'];
        if(!selectedRace['special'].includes("Low Cost Lineman")) {
            team.value += selectedTemplate['cost'];
        }
        document.querySelector("#treasury").textContent = team.treasury;
        document.querySelector("#value").textContent = team.value;
        document.querySelector(`#ma_${index}`).textContent = selectedTemplate['ma'];
        document.querySelector(`#st_${index}`).textContent = selectedTemplate['st'];
        document.querySelector(`#ag_${index}`).textContent = `${selectedTemplate['ag']}+`;
        document.querySelector(`#pa_${index}`).textContent = `${selectedTemplate['pa']}+`;
        document.querySelector(`#av_${index}`).textContent = `${selectedTemplate['av']}+`;
        document.querySelector(`#skill_${index}`).textContent = selectedTemplate['skill'];
        document.querySelector(`#pr_${index}`).textContent = selectedTemplate['primary'];
        document.querySelector(`#se_${index}`).textContent = selectedTemplate['secondary'];
        document.querySelector(`#qty_${index}`).textContent = `0-${selectedTemplate['maxQty']}`;
        document.querySelector(`#tag_${index}`).textContent = selectedTemplate['tag'];
        document.querySelector(`#cost_${index}`).textContent = `${selectedTemplate['cost']}k`;
        if(team.players.has(index)) {
            let player = team.players.get(index);
            player.nr = Number(document.querySelector(`#nr_${index}`).textContent);
            player.name = document.querySelector(`#name_${index}`).textContent;
        } else {
            team.players.set(index, new Player(select.value, document.querySelector(`#name_${index}`).value, Number(document.querySelector(`#nr_${index}`).value),
                                        false));
        }
        
    }
    console.log(team);
    if(selectedRace['special'].includes("Team Captain")) {
        const cap = document.querySelector("#captain");
        cap.innerHTML = '';
        const combos = document.getElementsByClassName('templates');
        for (let i = 0; i < combos.length; i++) {
            let c = combos[i];
            if(c.value != "0" && !templates.find(t => t['id'] == c.value)['bigGuy']) {
                cap.add(new Option(document.querySelector(`#nr_${i}`).value, document.querySelector(`#nr_${i}`).value));
            }
        }
    }
}

function clearForm(index) {
    document.querySelector(`#ma_${index}`).textContent = "";
    document.querySelector(`#st_${index}`).textContent = "";
    document.querySelector(`#ag_${index}`).textContent = "";
    document.querySelector(`#pa_${index}`).textContent = "";
    document.querySelector(`#av_${index}`).textContent = "";
    document.querySelector(`#skill_${index}`).textContent = "";
    document.querySelector(`#pr_${index}`).textContent = "";
    document.querySelector(`#se_${index}`).textContent = "";
    document.querySelector(`#qty_${index}`).textContent = "";
    document.querySelector(`#tag_${index}`).textContent = "";
    document.querySelector(`#cost_${index}`).textContent = "";
}

function setStaff(e) {
    const elem = e.target;
    switch(elem.id) {
        case "rr": {
            const rr = Number(elem.value);
            if(rr > 8 || rr < 0) {
                alert("MAX 8 and MIN 0 rerolls");
            } else {
                const diff = rr - team.reroll;
                team.reroll = rr;
                team.treasury -= diff * selectedRace['reroll'];
                if(team.treasury < 0) {
                    alert("MAX Treasury 1050k");
                    document.querySelector("#treasury").style.color = "red";
                } else {
                    document.querySelector("#treasury").style.color = "black";
                }
                document.querySelector("#treasury").textContent = team.treasury;
                team.value += diff * selectedRace['reroll'];
            }
            break;
        }
        case "dfs": {
            const df = Number(elem.value);
            if(df < 1 || df > 3) {
                alert("MAX 3 and MIN 1 dedicated fan");
            } else {
                const diff = df - team.df;
                team.df = df;
                team.treasury -= diff * 5;
                if(team.treasury < 0) {
                    alert("MAX Treasury 1050k");
                    document.querySelector("#treasury").style.color = "red";
                } else {
                    document.querySelector("#treasury").style.color = "black";
                }
                document.querySelector("#treasury").textContent = team.treasury;
                console.log(team);
                break;
            }
        }
        case "cheers": {
            const cheer = Number(elem.value);
            if(cheer > 6 || cheer < 0) {
                alert("MAX 6 and MIN 0 cheerleaders");
            } else {
                const diff = cheer - team.cheerleader;
                team.cheerleader = cheer;
                team.treasury -= diff * 10;
                if(team.treasury < 0) {
                    alert("MAX Treasury 1050k");
                    document.querySelector("#treasury").style.color = "red";
                } else {
                    document.querySelector("#treasury").style.color = "black";
                }
                document.querySelector("#treasury").textContent = team.treasury;
                team.value += diff * 10;
            }
            break;
        }
        case "asscoach": {
            const ass = Number(elem.value);
            if(ass > 6 || ass < 0) {
                alert("MAX 6 and MIN 0 cheerleaders");
            } else {
                const diff = ass - team.assistant;
                team.assistant = ass;
                team.treasury -= diff * 10;
                if(team.treasury < 0) {
                    alert("MAX Treasury 1050k");
                    document.querySelector("#treasury").style.color = "red";
                } else {
                    document.querySelector("#treasury").style.color = "black";
                }
                document.querySelector("#treasury").textContent = team.treasury;
                team.value += diff * 10;
            }
            break;
        }
        case "apothecary": {
            const apo = elem.checked;
            team.apothecary = apo;
            team.treasury -= apo ? 50 : -50;
            if(team.treasury < 0) {
                alert("MAX Treasury 1050k");
                document.querySelector("#treasury").style.color = "red";
            } else {
                document.querySelector("#treasury").style.color = "black";
            }
            document.querySelector("#treasury").textContent = team.treasury;
            team.value += apo ? 50 : -50;
            console.log(team);
            break;
        }
    }
}

function setName(e) {
    const elem = e.target;
    const index = elem.id.split("_")[1];
    if(!team || !team.players.has(index)) {
        return;
    }
    team.players.get(index).name = elem.value;
    console.log(team);
}

function setNumber(e) {
    const elem = e.target;
    const index = elem.id.split("_")[1];
    const numbers = document.querySelectorAll(".numbers");
    //Controllo duplicati
    numbers.forEach(nr => {
        if(elem.id != nr.id && elem.value == nr.value) {
            alert(`Number at line ${Number(index) + 1} not valid`);
            return;
        }
    });
    //Cambio numero a giocatore se selezionato
    if(!team || !team.players.has(index)) {
        return;
    }
    team.players.get(index).nr = Number(elem.value);
    console.log(team);
    if(selectedRace['special'].includes("Team Captain")) {
        const cap = document.querySelector("#captain");
        cap.innerHTML = '';
        const combos = document.getElementsByClassName('templates');
        for (let i = 0; i < combos.length; i++) {
            let c = combos[i];
            if(c.value != "0" && !templates.find(t => t['id'] == c.value)['bigGuy']) {
                cap.add(new Option(document.querySelector(`#nr_${i}`).value, document.querySelector(`#nr_${i}`).value));
            }
        }
    }
}

function setTeamName() {
    const elem = document.querySelector("#name");
    if(!team) {
        return;
    }
    team.name = elem.value;
    console.log(team);
}

function setCoach() {
    const elem = document.querySelector("#coach");
    if(!team) {
        return;
    }
    team.coach = elem.value;
    console.log(team);
}

function pdf() {
    if(!team) {
        return;
    }
    if(selectedRace['special'].includes("Team Captain")) {
        const cap = Number(document.querySelector("#captain").value);
        team.players.forEach(p => {
            if(p.nr == cap) {
                p.captain = true;
            }
        });
    }
    const mess = validate();
    if(mess) {
        alert(mess);
    } else {
        team.competition = Number(document.querySelector("#rosters").value);
        getPDF(JSON.stringify({
            ...team,
            players: Array.from(team.players.values())
        }));
        return;
    }
}

function validate() {
    let messages = "";
    if(team.treasury < 0) {
        messages += `Roster too expensive!\n`;
    }
    if(team.players.size < 11) {
        messages += `Minimum players allowed: 11! You have ${team.players.size}.\n`;
    }
    if(!team.name) {
        messages += `Team name mandatory!\n`;
    }
    if(!team.coach) {
        messages += `Coach mandatory!\n`;
    }
    let numbers = "";
    let sep = "";
    team.players.forEach(p => {
        if(!p.name) {
            numbers += sep + p.nr;
            sep = ", ";
        }
    });
    if(numbers) {
        messages += `Missing name on players ${numbers}!\n`;
    }
    if(document.querySelector("#league") && !team.league) {
        messages += `Must select a league!\n`;
    }
    if(document.querySelector("#chaos") && !team.special) {
        messages += `Must select a special rule!\n`;
    }
    //controllo su Insignificant
    let insignificant = 0, normal = 0;
    team.players.forEach(p => {
        const template = templates.find(t => t['id'] == p.id);
        if(template['skill'].includes("Insignificant")) {
            insignificant++;
        } else {
            normal++;
        }
    });
    if(insignificant > normal) {
        messages += `Too much 'Insignificant' players! ${insignificant} vs ${normal}`;
    }
    return messages;
}

function reset() {
    const combos = document.getElementsByClassName('templates');
    for (const c of combos) {
        c.innerHTML = "";
        c.add(new Option('Select', '0'));
        const index = c.id.split("_")[1];
        clearForm(index);
    }
    team = null;
    document.getElementById("apo").innerHTML = "<input type='checkbox' id='apothecary' name='apo' >";
    document.getElementById("rr_test").textContent = `Reroll: `;
    document.querySelector("#treasury").textContent = 1050;
    document.querySelector("#dfs").value = 1;
    document.querySelector("#cheers").value = 0;
    document.querySelector("#asscoach").value = 0;
    document.querySelector("#rr").value = 0;
    document.querySelector("#last_line").innerHTML = '';
}

function send() {
    if(!team) {
        return;
    }
    if(selectedRace['special'].includes("Team Captain")) {
        const cap = Number(document.querySelector("#captain").value);
        team.players.forEach(p => {
            if(p.nr == cap) {
                p.captain = true;
            }
        });
    }
    const mess = validate();
    if(mess) {
        alert(mess);
    } else {
        team.competition = Number(document.querySelector("#rosters").value);
       const resp = addTeam(JSON.stringify({
            ...team,
            players: Array.from(team.players.values())
        }));
        let msg = `Team ${team.name} `;
        if(resp['esito'] == 0) {
            msg += `non `;
        } 
        msg += `inserito`;
        alert(msg);
        return;
    }
}

document.addEventListener("DOMContentLoaded", init);
document.getElementById("race").addEventListener("change", setRaces);
document.querySelectorAll(".staff").forEach(n => {
    n.addEventListener("change", setStaff);
});

document.querySelectorAll(".templates").forEach(n => {
    n.addEventListener("change", setTemplate);
});
document.querySelectorAll(".names").forEach(n => {
    n.addEventListener("change", setName);
});
document.querySelectorAll(".numbers").forEach(n => {
    n.addEventListener("change", setNumber);
});
document.querySelector("#btn").addEventListener("click", pdf);
document.querySelector("#name").addEventListener("change", setTeamName);
document.querySelector("#coach").addEventListener("change", setCoach);
document.querySelector("#btn_team").addEventListener("click", send);