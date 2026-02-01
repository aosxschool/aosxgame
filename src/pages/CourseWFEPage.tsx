
export default function CourseWFEPage(props: { navigate: (to: string) => void; gameId: 'game1' | 'game2' | 'game3' }) {
  return (
    <div className="appBg">
      <div className="navContent">
        {/*
            WFE selection pages keep design consistent.
            If you want each WFE game to preselect a specific game_code from the DB,
            we can map gameId -> game_code later without changing existing logic.
        */}
      </div>
    </div>
  )
}
