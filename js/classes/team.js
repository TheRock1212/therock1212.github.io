
export class Team {
    name;
    coach;
    competition;
    race;
    reroll;
    df;
    cheerleader;
    assistant;
    apothecary;
    league;
    special;
    players;
    treasury;
    value;

    constructor(treasury, race, competition) {
        this.players = new Map();
        this.treasury = treasury;
        this.competition = competition;
        this.value = 0;
        this.name = this.coach = '';
        this.league = this.special = null;
        this.apothecary = false;
        this.df = 1;
        this.cheerleader = this.assistant = this.reroll = 0;
        this.race = race;  
    }
}