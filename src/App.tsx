import { InsightHarness } from './components/dev/InsightHarness'
import { StoryHarness } from './components/dev/StoryHarness'
import { NavigationHarness } from './components/dev/NavigationHarness'
import { useNavigationStore } from './stores/navigationStore'

function App() {
  const selectedLocationId = useNavigationStore((s) => s.selectedLocationId)

  return (
    <main className="min-h-svh bg-neutral-950 text-neutral-100">
      <InsightHarness />
      {selectedLocationId ? <StoryHarness /> : <NavigationHarness />}
    </main>
  )
}

export default App
