export type CharacterKey = "hitori" | "nijika" | "ryo" | "ikuyo";

const CHARACTER = {
  hitori: { name: "后藤一里", image: "/themes/kessoku/hitori.png" },
  nijika: { name: "伊地知虹夏", image: "/themes/kessoku/nijika.png" },
  ryo: { name: "山田凉", image: "/themes/kessoku/ryo.png" },
  ikuyo: { name: "喜多郁代", image: "/themes/kessoku/ikuyo.png" },
} satisfies Record<CharacterKey, { name: string; image: string }>;

export default function CharacterCue({ character, line }: { character: CharacterKey; line: string }) {
  const item = CHARACTER[character];
  return <aside className={`character-cue cue-${character}`} aria-label={`${item.name}的章节旁白`}>
    <img className="character-cue-figure" src={item.image} alt="" aria-hidden="true" />
    <div className="character-line"><strong>{item.name}</strong><p>{line}</p></div>
  </aside>;
}
