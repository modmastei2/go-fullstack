import './App.css'
import ViewComponent from './shared/components/view.component'

function App() {

  return (
    <>
      <ViewComponent id="feature" viewKey="feature" cell={{ data: { featureId: 1 }, text: "Feature 1" }} />
    </>
  )
}

export default App
