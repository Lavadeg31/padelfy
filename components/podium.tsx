import { Card, CardContent } from "@/components/ui/card"

interface PodiumProps {
  players: {
    name: string;
    score: number;
  }[];
}

export function Podium({ players }: PodiumProps) {
  const podiumOrder = [1, 0, 2]; // Silver, Gold, Bronze
  const medals = ["🥈", "🥇", "🥉"];

  return (
    <div className="flex justify-center items-end space-x-4 mb-8">
      {podiumOrder.map((index, position) => {
        const player = players[index];
        if (!player) return null;
        
        return (
          <Card key={index} className="w-32 text-center">
            <CardContent className={`pt-${6 - position * 2} pb-2`}>
              <div className="text-4xl mb-2">{medals[position]}</div>
              <div className="font-bold">{player.name}</div>
              <div className="text-sm text-muted-foreground">{player.score}</div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

