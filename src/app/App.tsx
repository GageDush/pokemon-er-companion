import {
  Activity,
  BookOpen,
  Bug,
  Cog,
  Database,
  FileSearch,
  Home,
  Map,
  Package,
  Shield,
  Sparkles,
  Swords,
  Users
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { ConfidenceBadge } from "../components/ConfidenceBadge";
import { RecordList } from "../components/RecordList";
import { SearchBox } from "../components/SearchBox";
import { analyzeSaveFile, exportSaveDebugJson } from "../save/saveLoader";
import { compareSaveBytes, SaveCompareResult } from "../save/saveCompare";
import { searchDocuments } from "../search/searchIndex";
import { analyzeDefensiveCoverage } from "../team-builder/coverage";
import { recommendBuilds } from "../team-builder/recommender";
import { ParsedSave, ParsedPokemon, Species } from "../types";
import { AppData, emptyData, loadAppData } from "./dataClient";

type PageKey =
  | "home"
  | "wiki"
  | "pokedex"
  | "moves"
  | "abilities"
  | "subabilities"
  | "items"
  | "locations"
  | "trainers"
  | "save"
  | "team"
  | "debug"
  | "settings";

const NAV: Array<{ key: PageKey; label: string; icon: typeof Home }> = [
  { key: "home", label: "Home", icon: Home },
  { key: "wiki", label: "Wiki", icon: BookOpen },
  { key: "pokedex", label: "Pokedex", icon: Database },
  { key: "moves", label: "Moves", icon: Swords },
  { key: "abilities", label: "Abilities", icon: Sparkles },
  { key: "subabilities", label: "Sub-Abilities", icon: Shield },
  { key: "items", label: "Items", icon: Package },
  { key: "locations", label: "Locations", icon: Map },
  { key: "trainers", label: "Trainers", icon: Users },
  { key: "save", label: "Save Manager", icon: FileSearch },
  { key: "team", label: "Team Builder", icon: Activity },
  { key: "debug", label: "Debug/Compare", icon: Bug },
  { key: "settings", label: "Settings/About", icon: Cog }
];

export function App() {
  const [page, setPage] = useState<PageKey>("home");
  const [data, setData] = useState<AppData>(emptyData);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAppData().then((loaded) => {
      setData(loaded);
      setLoading(false);
    });
  }, []);

  const totals = data.manifest?.totals;

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">ER</div>
          <div>
            <strong>Elite Redux</strong>
            <span>Companion</span>
          </div>
        </div>
        <nav>
          {NAV.map((item) => {
            const Icon = item.icon;
            return (
              <button className={page === item.key ? "active" : ""} key={item.key} onClick={() => setPage(item.key)} title={item.label}>
                <Icon size={18} aria-hidden="true" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </aside>
      <main className="main">
        <header className="topbar">
          <div>
            <p className="eyebrow">Local-first read-only vertical slice</p>
            <h1>{NAV.find((item) => item.key === page)?.label}</h1>
          </div>
          <div className="status-pill">{loading ? "Loading data" : `${totals?.species ?? data.species.length} species`}</div>
        </header>
        <Page page={page} data={data} />
      </main>
    </div>
  );
}

function Page({ page, data }: { page: PageKey; data: AppData }) {
  switch (page) {
    case "home":
      return <HomePage data={data} />;
    case "wiki":
      return <WikiPage data={data} />;
    case "pokedex":
      return <PokedexPage data={data} />;
    case "moves":
      return <SimpleDataPage title="Moves" records={data.moves.map((move) => ({ id: move.id, title: move.name, subtitle: move.effectText, confidence: move.confidence }))} />;
    case "abilities":
      return <SimpleDataPage title="Abilities" records={data.abilities.map((ability) => ({ id: ability.id, title: ability.name, subtitle: ability.effectText, confidence: ability.confidence }))} />;
    case "subabilities":
      return <SimpleDataPage title="Sub-Abilities" records={data.subabilities.map((ability) => ({ id: ability.id, title: ability.name, subtitle: ability.effectText, confidence: ability.confidence }))} />;
    case "items":
      return <SimpleDataPage title="Items" records={data.items.map((item) => ({ id: item.id, title: item.name, subtitle: item.description, confidence: item.confidence }))} />;
    case "locations":
      return <SimpleDataPage title="Locations" records={data.locations.map((location) => ({ id: location.id, title: location.name, subtitle: location.earliestAvailability, confidence: location.confidence, meta: location.notes[0] }))} />;
    case "trainers":
      return <SimpleDataPage title="Trainers" records={data.trainers.map((trainer) => ({ id: trainer.id, title: trainer.name, subtitle: trainer.location, confidence: trainer.confidence, meta: trainer.notes[0] }))} />;
    case "save":
      return <SaveManagerPage />;
    case "team":
      return <TeamBuilderPage data={data} />;
    case "debug":
      return <DebugComparePage />;
    case "settings":
      return <SettingsPage data={data} />;
  }
}

function HomePage({ data }: { data: AppData }) {
  const cards = [
    ["Species", data.species.length],
    ["Moves", data.moves.length],
    ["Abilities", data.abilities.length],
    ["Locations", data.locations.length],
    ["Trainers", data.trainers.length],
    ["Wiki pages", data.wiki.length]
  ];
  return (
    <section className="content-stack">
      <div className="hero-band">
        <h2>Source-tracked wiki, save metadata, and legal build guardrails for Pokemon Elite Redux.</h2>
        <p>Core workflows run locally. Save parsing is read-only, and recommendations stay constrained to parsed data or current save observations.</p>
      </div>
      <div className="metric-grid">
        {cards.map(([label, value]) => (
          <div className="metric" key={label}>
            <span>{label}</span>
            <strong>{value}</strong>
          </div>
        ))}
      </div>
      {data.warnings.length > 0 ? (
        <section className="panel">
          <h2>Data Warnings</h2>
          <ul className="tight-list">
            {data.warnings.slice(0, 8).map((warning) => (
              <li key={warning}>{warning}</li>
            ))}
          </ul>
        </section>
      ) : null}
    </section>
  );
}

function WikiPage({ data }: { data: AppData }) {
  const [query, setQuery] = useState("");
  const docs = useMemo(() => searchDocuments(data.searchIndex, query, ["wiki"]), [data.searchIndex, query]);
  return (
    <section className="content-stack">
      <SearchBox value={query} onChange={setQuery} placeholder="Search mechanics, FAQ, changelog, docs" />
      <RecordList records={docs.map((doc) => ({ id: doc.id, title: doc.title, subtitle: doc.summary, confidence: doc.confidence }))} emptyText="No wiki pages loaded. Run data generation." />
    </section>
  );
}

function PokedexPage({ data }: { data: AppData }) {
  const [query, setQuery] = useState("");
  const records = data.species
    .filter((species) => `${species.name} ${species.types.join(" ")}`.toLowerCase().includes(query.toLowerCase()))
    .slice(0, 120);
  return (
    <section className="content-stack">
      <SearchBox value={query} onChange={setQuery} placeholder="Search species and types" />
      {records.length === 0 ? <p className="empty">No species records loaded. Run data generation.</p> : null}
      <div className="species-grid">
        {records.map((species) => (
          <SpeciesCard species={species} key={species.id} />
        ))}
      </div>
    </section>
  );
}

function SpeciesCard({ species }: { species: Species }) {
  const primaryType = species.types[0] ?? "Normal";
  return (
    <article className="species-card" style={{ borderColor: typeColor(primaryType) }}>
      <div className="species-art" style={{ background: typeWash(primaryType) }}>
        {species.spritePath ? <img src={species.spritePath} alt="" loading="lazy" /> : <span>{species.name.slice(0, 2).toUpperCase()}</span>}
      </div>
      <div className="species-body">
        <div className="species-title">
          <div>
            <small>#{species.dexNumber ?? "?"}</small>
            <h3>{species.name}</h3>
          </div>
          <ConfidenceBadge confidence={species.confidence} />
        </div>
        <div className="type-row">
          {species.types.length ? species.types.map((type) => <span className="type-chip" style={{ background: typeColor(type) }} key={type}>{type}</span>) : <span className="type-chip muted">Unknown</span>}
        </div>
        {species.baseStats ? (
          <div className="mini-stats">
            <span>HP {species.baseStats.hp}</span>
            <span>Atk {species.baseStats.attack}</span>
            <span>SpA {species.baseStats.spAttack}</span>
            <span>Spe {species.baseStats.speed}</span>
          </div>
        ) : null}
      </div>
    </article>
  );
}

function SimpleDataPage({ title, records }: { title: string; records: Array<{ id: string; title: string; subtitle?: string; confidence?: string; meta?: string }> }) {
  const [query, setQuery] = useState("");
  const filtered = records.filter((record) => `${record.title} ${record.subtitle ?? ""} ${record.meta ?? ""}`.toLowerCase().includes(query.toLowerCase())).slice(0, 250);
  return (
    <section className="content-stack">
      <SearchBox value={query} onChange={setQuery} placeholder={`Search ${title.toLowerCase()}`} />
      <RecordList records={filtered} emptyText={`No ${title.toLowerCase()} records loaded.`} />
    </section>
  );
}

function SaveManagerPage() {
  const [save, setSave] = useState<ParsedSave | undefined>();
  const [error, setError] = useState<string | undefined>();

  async function onFile(file?: File) {
    if (!file) return;
    setError(undefined);
    try {
      setSave(await analyzeSaveFile(file));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not analyze save file.");
    }
  }

  return (
    <section className="content-stack">
      <label className="drop-zone">
        <FileSearch size={28} aria-hidden="true" />
        <span>Choose a `.sav` or `.srm` file for local read-only analysis</span>
        <input type="file" accept=".sav,.srm,application/octet-stream" onChange={(event) => onFile(event.target.files?.[0])} />
      </label>
      {error ? <p className="error">{error}</p> : null}
      {save ? (
        <section className="panel">
          <div className="panel-heading">
            <h2>{save.metadata.fileName}</h2>
            <ConfidenceBadge confidence={save.metadata.parserConfidence} />
          </div>
          <dl className="facts">
            <div><dt>Size</dt><dd>{save.metadata.fileSize} bytes</dd></div>
            <div><dt>Format</dt><dd>{save.metadata.likelyFormat}</dd></div>
            <div><dt>SHA-256</dt><dd className="hash">{save.metadata.sha256}</dd></div>
          </dl>
          <pre className="hex">{save.metadata.hexPreview}</pre>
          <button className="primary" onClick={() => downloadText("save-debug.json", exportSaveDebugJson(save))}>Export debug JSON</button>
          <ul className="tight-list">{save.warnings.map((warning) => <li key={warning}>{warning}</li>)}</ul>
        </section>
      ) : null}
    </section>
  );
}

function TeamBuilderPage({ data }: { data: AppData }) {
  const mockOwned: ParsedPokemon[] = data.species.slice(0, 6).map((species, index) => ({
    id: `mock-${species.id}`,
    source: "mock",
    slot: index + 1,
    speciesId: species.id,
    speciesName: species.name,
    level: 20,
    moves: [],
    subAbilities: [],
    confidence: "low",
    warnings: ["Mock owned Pokemon used until save party/PC offsets are confirmed."]
  }));
  const recommendations = recommendBuilds({ ownedPokemon: mockOwned, species: data.species, levelCap: 20, randomizerSuspected: true });
  const teamSpecies = mockOwned
    .map((owned) => data.species.find((species) => species.id === owned.speciesId))
    .filter((species): species is Species => Boolean(species));
  const coverage = analyzeDefensiveCoverage(teamSpecies);
  return (
    <section className="content-stack">
      <p className="notice">Using mock owned Pokemon until real save party/PC parsing is fixture-confirmed. No Pokemon are created in saves and no save writing exists.</p>
      <section className="panel">
        <h2>Defensive Coverage</h2>
        <div className="coverage-grid">
          {coverage.map((row) => (
            <div className="coverage-row" key={row.type}>
              <span className="type-chip" style={{ background: typeColor(row.type) }}>{row.type}</span>
              <strong>{row.weak}</strong>
              <small>weak</small>
              <strong>{row.resist}</strong>
              <small>resist</small>
              <strong>{row.immune}</strong>
              <small>immune</small>
            </div>
          ))}
        </div>
      </section>
      <div className="record-list">
        {recommendations.map((recommendation) => (
          <article className="record-row" key={recommendation.pokemonId}>
            <div>
              <h3>{recommendation.speciesName}</h3>
              <p>{recommendation.role} · {recommendation.nature ?? "Nature uncertain"}</p>
              <small>{recommendation.reasoning}</small>
              {recommendation.legality.warnings.length ? <small>{recommendation.legality.warnings.join(" ")}</small> : null}
            </div>
            <ConfidenceBadge confidence={recommendation.confidence} />
          </article>
        ))}
      </div>
    </section>
  );
}

function DebugComparePage() {
  const [a, setA] = useState<Uint8Array | undefined>();
  const [b, setB] = useState<Uint8Array | undefined>();
  const result: SaveCompareResult | undefined = useMemo(() => (a && b ? compareSaveBytes(a, b) : undefined), [a, b]);

  async function readFile(file: File | undefined, setter: (bytes: Uint8Array) => void) {
    if (!file) return;
    setter(new Uint8Array(await file.arrayBuffer()));
  }

  return (
    <section className="content-stack">
      <div className="two-column">
        <label className="drop-zone compact"><span>Save A</span><input type="file" accept=".sav,.srm,application/octet-stream" onChange={(event) => readFile(event.target.files?.[0], setA)} /></label>
        <label className="drop-zone compact"><span>Save B</span><input type="file" accept=".sav,.srm,application/octet-stream" onChange={(event) => readFile(event.target.files?.[0], setB)} /></label>
      </div>
      {result ? (
        <section className="panel">
          <h2>Byte Compare</h2>
          <dl className="facts">
            <div><dt>Changed bytes</dt><dd>{result.changedByteCount}</dd></div>
            <div><dt>Compared bytes</dt><dd>{result.comparedBytes}</dd></div>
            <div><dt>Ranges shown</dt><dd>{result.ranges.length}</dd></div>
          </dl>
          <RecordList records={result.ranges.slice(0, 30).map((range) => ({ id: `${range.start}-${range.end}`, title: `0x${range.start.toString(16)} - 0x${range.end.toString(16)}`, subtitle: `${range.beforePreview} -> ${range.afterPreview}`, meta: `${range.length} byte(s)` }))} emptyText="No differences." />
        </section>
      ) : null}
    </section>
  );
}

function SettingsPage({ data }: { data: AppData }) {
  return (
    <section className="content-stack">
      <section className="panel">
        <h2>Safety Boundaries</h2>
        <ul className="tight-list">
          <li>No NPC editing.</li>
          <li>No generated Pokemon.</li>
          <li>No save writing.</li>
          <li>Recommendations are constrained by parsed game data or current save observations.</li>
        </ul>
      </section>
      <section className="panel">
        <h2>Generated Data</h2>
        <pre className="json">{JSON.stringify(data.manifest ?? { warning: "No generated manifest loaded." }, null, 2)}</pre>
      </section>
    </section>
  );
}

function downloadText(fileName: string, text: string) {
  const blob = new Blob([text], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}

function typeColor(type: string): string {
  return TYPE_COLORS[type] ?? "#6b7280";
}

function typeWash(type: string): string {
  return `${typeColor(type)}24`;
}

const TYPE_COLORS: Record<string, string> = {
  Normal: "#7c7f74",
  Fire: "#d64f31",
  Water: "#3478c7",
  Grass: "#3f8f54",
  Electric: "#c89b21",
  Ice: "#50a8b7",
  Fighting: "#a74438",
  Poison: "#8b5ab6",
  Ground: "#a8733d",
  Flying: "#6d86c7",
  Psychic: "#c24e7c",
  Bug: "#7b9334",
  Rock: "#8f7f4a",
  Ghost: "#615496",
  Dragon: "#5962b8",
  Dark: "#4d433f",
  Steel: "#687986",
  Fairy: "#c76d9f"
};
