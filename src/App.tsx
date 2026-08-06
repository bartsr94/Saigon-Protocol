import { InsightHarness } from './components/dev/InsightHarness'
import { StoryHarness } from './components/dev/StoryHarness'

function App() {
  return (
    <main className="min-h-svh bg-neutral-950 text-neutral-100">
      <InsightHarness />
      <StoryHarness />
    </main>
  )
}

export default App
