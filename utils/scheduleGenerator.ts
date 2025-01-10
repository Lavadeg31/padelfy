interface Court {
  id: number;
  name: string;
}

interface Game {
  court: Court;
  team1: string[];
  team2: string[];
}

interface PlayerPairings {
  partneredWith: Set<string>;
  playedAgainst: Map<string, number>;
}

function shuffleArray<T>(array: T[]): T[] {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

export function generateSchedule(players: string[], courts: Court[], mode: 'solo' | 'fixed'): Game[][] {
  if (mode === 'solo') {
    return generateSoloSchedule(players, courts);
  } else {
    return generateFixedSchedule(players, courts);
  }
}

function generateSoloSchedule(players: string[], courts: Court[]): Game[][] {
  // For n players, we need (n-1) rounds
  const rounds: Game[][] = [];
  if (players.length < 4) return rounds;

  // Create a copy of players array to manipulate
  let playersList = [...players];
  
  // If odd number of players, add a dummy player
  if (playersList.length % 2 !== 0) {
    playersList.push('dummy');
  }

  const n = playersList.length;
  const roundCount = n - 1;
  const gamesPerRound = Math.floor(n / 4);

  // Create round-robin schedule
  for (let round = 0; round < roundCount; round++) {
    const roundGames: Game[] = [];
    const roundPairings: string[][] = [];
    
    // In each round, pair players
    for (let i = 0; i < n/2; i++) {
      const player1 = playersList[i];
      const player2 = playersList[n - 1 - i];
      
      // Skip pairings with dummy player
      if (player1 !== 'dummy' && player2 !== 'dummy') {
        roundPairings.push([player1, player2]);
      }
    }

    // Create games from pairings
    for (let i = 0; i < roundPairings.length; i += 2) {
      if (i + 1 < roundPairings.length) {
        roundGames.push({
          court: courts[Math.floor(i/2) % courts.length],
          team1: roundPairings[i],
          team2: roundPairings[i + 1]
        });
      }
    }

    if (roundGames.length > 0) {
      rounds.push(roundGames);
    }

    // Rotate players for next round: keep first player fixed, rotate the rest
    playersList = [
      playersList[0],
      ...playersList.slice(-1),
      ...playersList.slice(1, -1)
    ];
  }

  return rounds;
}

function tryGenerateSchedule(
  players: string[], 
  courts: Court[], 
  requiredRounds: number,
  gamesPerRound: number
): Game[][] {
  const rounds: Game[][] = [];
  const pairings = new Map<string, PlayerPairings>();
  
  // Initialize pairings tracking
  players.forEach(player => {
    pairings.set(player, {
      partneredWith: new Set<string>(),
      playedAgainst: new Map<string, number>()
    });
  });

  for (let round = 0; round < requiredRounds; round++) {
    const roundGames = generateRound(players, courts, pairings, gamesPerRound);
    if (roundGames.length === gamesPerRound) {
      rounds.push(roundGames);
    } else {
      // If we can't generate a valid round, start over
      break;
    }
  }

  return rounds;
}

function generateRound(
  players: string[],
  courts: Court[],
  pairings: Map<string, PlayerPairings>,
  gamesPerRound: number
): Game[] {
  const games: Game[] = [];
  const availablePlayers = new Set(players);
  let attempts = 0;
  const maxAttempts = 100; // Increased from 50

  while (availablePlayers.size >= 4 && games.length < gamesPerRound && attempts < maxAttempts) {
    const shuffledPlayers = shuffleArray(Array.from(availablePlayers));
    const game = tryCreateGame(shuffledPlayers, pairings, courts[games.length % courts.length]);
    
    if (game) {
      games.push(game);
      // Remove assigned players from available pool
      [...game.team1, ...game.team2].forEach(player => availablePlayers.delete(player));
    }
    attempts++;
  }

  // Only return games if we got all the games we needed
  return games.length === gamesPerRound ? games : [];
}

function tryCreateGame(
  availablePlayers: string[],
  pairings: Map<string, PlayerPairings>,
  court: Court
): Game | null {
  const shuffledPlayers = shuffleArray(availablePlayers);
  const team1 = findTeam(shuffledPlayers, pairings);
  
  if (!team1) return null;
  
  // Remove team1 players from available pool
  const remainingPlayers = shuffledPlayers.filter(p => !team1.includes(p));
  const team2 = findTeam(remainingPlayers, pairings, team1);
  
  if (!team2) return null;

  // Update pairings
  updatePairings(team1, team2, pairings);

  return {
    court,
    team1,
    team2
  };
}

function findTeam(
  players: string[],
  pairings: Map<string, PlayerPairings>,
  opposingTeam?: string[]
): string[] | null {
  if (players.length < 2) return null;

  // Sort players by number of unique partners they've had
  const sortedPlayers = [...players].sort((a, b) => {
    const aPartnerships = pairings.get(a)!.partneredWith.size;
    const bPartnerships = pairings.get(b)!.partneredWith.size;
    return aPartnerships - bPartnerships;
  });

  // For each player, try to find a partner they haven't played with yet
  for (let i = 0; i < sortedPlayers.length; i++) {
    const player1 = sortedPlayers[i];
    const player1Pairings = pairings.get(player1)!;

    // Filter potential partners to only those who haven't partnered with player1
    const potentialPartners = sortedPlayers
      .slice(i + 1)
      .filter(player2 => !player1Pairings.partneredWith.has(player2));

    for (const player2 of potentialPartners) {
      // If this is for team2, check if they can play against team1
      if (opposingTeam && !canPlayAgainst([player1, player2], opposingTeam, pairings)) {
        continue;
      }

      return [player1, player2];
    }
  }

  return null;
}

function canPlayAgainst(
  team1: string[],
  team2: string[],
  pairings: Map<string, PlayerPairings>
): boolean {
  return team1.every(p1 => 
    team2.every(p2 => {
      const matchCount = pairings.get(p1)?.playedAgainst.get(p2) || 0;
      return matchCount < 1; // Changed from 2 to 1 to prevent playing against same opponents twice
    })
  );
}

function updatePairings(
  team1: string[],
  team2: string[],
  pairings: Map<string, PlayerPairings>
) {
  // Update partnerships
  team1.forEach(p1 => {
    team1.forEach(p2 => {
      if (p1 !== p2) {
        pairings.get(p1)!.partneredWith.add(p2);
      }
    });
  });

  team2.forEach(p1 => {
    team2.forEach(p2 => {
      if (p1 !== p2) {
        pairings.get(p1)!.partneredWith.add(p2);
      }
    });
  });

  // Update opponents
  team1.forEach(p1 => {
    team2.forEach(p2 => {
      const p1Pairings = pairings.get(p1)!;
      const p2Pairings = pairings.get(p2)!;
      
      const currentCount1 = p1Pairings.playedAgainst.get(p2) || 0;
      const currentCount2 = p2Pairings.playedAgainst.get(p1) || 0;
      
      p1Pairings.playedAgainst.set(p2, currentCount1 + 1);
      p2Pairings.playedAgainst.set(p1, currentCount2 + 1);
    });
  });
}

function generateFixedSchedule(players: string[], courts: Court[]): Game[][] {
  const rounds: Game[][] = [];
  const teams = players.reduce((acc, player, index, array) => {
    if (index % 2 === 0) {
      acc.push([player, array[index + 1]]);
    }
    return acc;
  }, [] as string[][]);
  
  const totalTeams = teams.length;
  const totalRounds = totalTeams - 1;

  for (let round = 0; round < totalRounds; round++) {
    const roundGames: Game[] = [];
    
    for (let i = 0; i < totalTeams / 2; i++) {
      const team1Index = i;
      const team2Index = (totalTeams - 1 - i + round) % (totalTeams - 1);
      const team2ActualIndex = team2Index === i ? totalTeams - 1 : team2Index;

      roundGames.push({
        court: courts[i % courts.length],
        team1: teams[team1Index],
        team2: teams[team2ActualIndex]
      });
    }

    rounds.push(roundGames);
  }

  return rounds;
}

