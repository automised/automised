export function TestimonialCards() {
  return (
    <div className="relative h-[500px]">
      <div className="absolute right-20 top-16 w-80 rotate-2 rounded-xl bg-card/80 backdrop-blur-sm border border-border p-6 shadow-xl animate-float">
        <p className="text-sm leading-relaxed text-card-foreground">
          {
            "Used Automised as a middleman for over $45k worth of deals since 2023. Automised has always been super smooth and fast."
          }
        </p>
        <p className="mt-4 text-sm text-muted-foreground">- @bayc3</p>
      </div>

      <div className="absolute right-32 top-60 w-80 -rotate-2 rounded-xl bg-card/80 backdrop-blur-sm border border-border p-6 shadow-xl animate-float-delayed">
        <p className="text-sm leading-relaxed text-card-foreground">
          {
            "Been scammed too many times before, but this bot made me feel secure. Did a $1,800 LTC deal with no issues. Instant release."
          }
        </p>
        <p className="mt-4 text-sm text-muted-foreground">- @winner.wins</p>
      </div>
      {/* </CHANGE> */}
    </div>
  )
}
