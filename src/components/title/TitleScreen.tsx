import { GameFrame } from '../ui/GameFrame'
import { Eyebrow, Title } from '../ui/Screen'
import { Button } from '../ui/Button'

interface TitleScreenProps {
  canContinue: boolean
  onContinue: () => void
  onNewRun: () => void
}

export function TitleScreen({ canContinue, onContinue, onNewRun }: TitleScreenProps) {
  return (
    <GameFrame>
      <div className="mx-auto flex min-h-[70vh] max-w-2xl flex-col items-center justify-center text-center">
        <Eyebrow>Saigon SEZ // 2226</Eyebrow>
        <Title className="mt-2">Saigon Protocol</Title>
        <p className="mt-3 max-w-md text-sm leading-relaxed text-neutral-400">
          Rain, neon, and a contract you can't afford to walk away from.
        </p>

        <div className="mt-10 flex w-full max-w-xs flex-col gap-3">
          {canContinue && (
            <Button onClick={onContinue} sound="popup-open">
              Continue
            </Button>
          )}
          <Button
            variant={canContinue ? 'secondary' : 'primary'}
            sound="swipe"
            onClick={onNewRun}
          >
            New Run
          </Button>
        </div>
      </div>
    </GameFrame>
  )
}
