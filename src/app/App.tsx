import {
  Activity,
  ArrowLeft,
  BadgeInfo,
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
import { buildSpeciesDetailData } from "../dex/speciesDetail";
import { typeColor, typeWash } from "../dex/typeColors";
import { analyzeSaveArtifact, exportSaveDebugJson } from "../save/saveLoader";
import { compareSaveBytes, SaveCompareResult } from "../save/saveCompare";
import { searchDocuments } from "../search/searchIndex";
import { analyzeDefensiveCoverage } from "../team-builder/coverage";
import { recommendBuilds } from "../team-builder/recommender";
import { resolveOwnedTeam } from "../team-builder/teamState";
import { ParsedSave, ParsedPokemon, Species } from "../types";
import { AppData, buildSaveParserLookupContext, emptyData, loadAppData } from "./dataClient";

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
  const [currentSave, setCurrentSave] = useState<ParsedSave | undefined>();
  const [loading, setLoading] = useState(true);
  const [bootReady, setBootReady] = useState(false);

  useEffect(() => {
    let mounted = true;
    let dataResolved = false;
    let minimumElapsed = false;

    const maybeFinish = () => {
      if (mounted && dataResolved && minimumElapsed) {
        setBootReady(true);
      }
    };

    const timer = window.setTimeout(() => {
      minimumElapsed = true;
      maybeFinish();
    }, 1350);

    loadAppData().then((loaded) => {
      if (!mounted) return;
      setData(loaded);
      setLoading(false);
      dataResolved = true;
      maybeFinish();
    });

    return () => {
      mounted = false;
      window.clearTimeout(timer);
    };
  }, []);

  const totals = data.manifest?.totals;
  const primaryNav = NAV.filter((item) => ["home", "pokedex", "team", "save"].includes(item.key));
  const utilityNav = NAV.filter((item) => !["home", "pokedex", "team", "save"].includes(item.key));

  if (!bootReady) {
    return <BootLoader loading={loading} speciesCount={totals?.species ?? data.species.length} />;
  }

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
            <p className="eyebrow">Local-first field companion</p>
            <h1>{NAV.find((item) => item.key === page)?.label}</h1>
            <div className="capability-row">
              <span className="capsule capsule-blue">iPhone-first</span>
              <span className="capsule capsule-green">Local-first</span>
              <span className="capsule capsule-red">Read-only saves</span>
              <span className="capsule capsule-purple">Source confidence</span>
            </div>
          </div>
          <div className="status-pill">{loading ? "Loading data" : `${totals?.species ?? data.species.length} species`}</div>
        </header>
        <div className="utility-nav" aria-label="Utility pages">
          {utilityNav.map((item) => (
            <button className={page === item.key ? "active" : ""} key={item.key} onClick={() => setPage(item.key)} type="button">
              {item.label}
            </button>
          ))}
        </div>
        <Page page={page} data={data} currentSave={currentSave} onSaveLoaded={setCurrentSave} />
      </main>
      <nav className="mobile-primary-nav" aria-label="Primary mobile navigation">
        {primaryNav.map((item) => {
          const Icon = item.icon;
          return (
            <button className={page === item.key ? "active" : ""} key={item.key} onClick={() => setPage(item.key)} type="button">
              <Icon size={18} aria-hidden="true" />
              <span>{item.label.replace(" Manager", "").replace(" Builder", "")}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}

function BootLoader({ loading, speciesCount }: { loading: boolean; speciesCount: number }) {
  const signals = [
    "Dex link establishing",
    "Local source tables verified",
    "Read-only companion online"
  ];

  return (
    <div className="boot-shell" aria-live="polite">
      <div className="boot-noise" />
      <div className="boot-gradient boot-gradient-a" />
      <div className="boot-gradient boot-gradient-b" />
      <div className="boot-core">
        <div className="boot-ring boot-ring-outer" />
        <div className="boot-ring boot-ring-mid" />
        <div className="boot-ring boot-ring-inner" />
        <div className="boot-scanline" />
        <div className="boot-content">
          <span className="boot-kicker">Elite Redux Companion</span>
          <h1>Field device booting</h1>
          <p>Cold-loading local Dex data, confidence metadata, and read-only save tools.</p>
          <div className="boot-status">
            <span>{loading ? "Syncing generated sources" : "Local data ready"}</span>
            <strong>{speciesCount || "1906"} species indexed</strong>
          </div>
          <ul className="boot-signal-list">
            {signals.map((signal) => (
              <li key={signal}>{signal}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

function Page({
  page,
  data,
  currentSave,
  onSaveLoaded
}: {
  page: PageKey;
  data: AppData;
  currentSave?: ParsedSave;
  onSaveLoaded: (save: ParsedSave | undefined) => void;
}) {
  switch (page) {
    case "home":
      return <HomePage data={data} currentSave={currentSave} />;
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
      return <SaveManagerPage data={data} save={currentSave} onSaveLoaded={onSaveLoaded} />;
    case "team":
      return <TeamBuilderPage data={data} currentSave={currentSave} />;
    case "debug":
      return <DebugComparePage />;
    case "settings":
      return <SettingsPage data={data} />;
  }
}

function HomePage({ data, currentSave }: { data: AppData; currentSave?: ParsedSave }) {
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
      <div className="hero-band home-hero">
        <div className="hero-copy">
          <span className="section-kicker">Dex + team + save workflow</span>
          <h2>Premium local companion for Elite Redux runs, without hiding uncertainty.</h2>
          <p>Built for quick in-hand decisions: search species, inspect builds, check confidence, and review save metadata without ever uploading the game or mutating the save.</p>
        </div>
        <div className="hero-actions">
          <span className="soft-pill">No phone-side ROM upload</span>
          <span className="soft-pill">Private/local sprite bundling</span>
          <span className="soft-pill">Legality warnings stay visible</span>
        </div>
      </div>
      <div className="metric-grid">
        {cards.map(([label, value]) => (
          <div className="metric" key={label}>
            <span>{label}</span>
            <strong>{value}</strong>
          </div>
        ))}
      </div>
      <div className="dashboard-grid">
        <section className="panel feature-panel">
          <div className="panel-heading">
            <h2>Read-only save status</h2>
            <span className="status-pill">{currentSave ? "Loaded" : "Awaiting fixture-backed save"}</span>
          </div>
          {currentSave ? (
            <dl className="facts">
              <div><dt>File</dt><dd>{currentSave.metadata.fileName}</dd></div>
              <div><dt>Format</dt><dd>{currentSave.metadata.likelyFormat}</dd></div>
              <div><dt>Party parsed</dt><dd>{currentSave.party.length > 0 ? `${currentSave.party.length} slot(s)` : "Not yet confirmed"}</dd></div>
            </dl>
          ) : (
            <p className="notice">Load a local save in Save Manager to capture metadata, hash, and debug output. Party and PC views remain disabled until fixture-backed offsets are proven.</p>
          )}
        </section>
        <section className="panel feature-panel">
          <div className="panel-heading">
            <h2>Trust model</h2>
            <BadgeInfo size={18} aria-hidden="true" />
          </div>
          <ul className="tight-list">
            <li>Recommendations stay constrained to parsed game data and current-owned state.</li>
            <li>Low-confidence rows remain searchable, but not silently promoted.</li>
            <li>Save parsing stays read-only until fixture-backed validation exists.</li>
          </ul>
        </section>
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
  const [selectedSpeciesId, setSelectedSpeciesId] = useState<string | undefined>();
  const [typeFilter, setTypeFilter] = useState("");
  const [confidenceFilter, setConfidenceFilter] = useState("");
  const [sourceFilter, setSourceFilter] = useState("");
  const typeOptions = useMemo(() => Array.from(new Set(data.species.flatMap((species) => species.types))).sort(), [data.species]);
  const detail = selectedSpeciesId
    ? buildSpeciesDetailData({
        speciesId: selectedSpeciesId,
        species: data.species,
        learnsets: data.learnsets,
        evolutions: data.evolutions,
        locations: data.locations
      })
    : undefined;

  if (detail) {
    return <SpeciesDetailView detail={detail} onBack={() => setSelectedSpeciesId(undefined)} />;
  }

  const records = data.species
    .filter((species) => `${species.name} ${species.types.join(" ")}`.toLowerCase().includes(query.toLowerCase()))
    .filter((species) => !typeFilter || species.types.includes(typeFilter))
    .filter((species) => !confidenceFilter || species.confidence === confidenceFilter)
    .filter((species) => !sourceFilter || species.source.some((source) => source.sourceFile.includes(sourceFilter) || source.sourcePath?.includes(sourceFilter)))
    .slice(0, 120);
  return (
    <section className="content-stack">
      <section className="panel filter-panel">
        <div className="panel-heading">
          <h2>Pokedex scan</h2>
          <span className="status-pill">Local sprite data</span>
        </div>
        <SearchBox value={query} onChange={setQuery} placeholder="Search species, type, or local source data" />
        <div className="filter-bar">
          <select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)} aria-label="Filter by type">
            <option value="">All types</option>
            {typeOptions.map((type) => <option value={type} key={type}>{type}</option>)}
          </select>
          <select value={confidenceFilter} onChange={(event) => setConfidenceFilter(event.target.value)} aria-label="Filter by confidence">
            <option value="">All confidence</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
          <select value={sourceFilter} onChange={(event) => setSourceFilter(event.target.value)} aria-label="Filter by source">
            <option value="">All sources</option>
            <option value="ER-nextdex-main.zip">NextDex</option>
            <option value=".xlsx">Spreadsheet</option>
            <option value=".pdf">PDF</option>
          </select>
        </div>
      </section>
      {records.length === 0 ? <p className="empty">No species matched those filters. Clear a filter or rerun data generation if JSON is missing.</p> : null}
      {records.length > 0 ? <p className="list-caption">Showing {records.length} species card(s) from local generated data.</p> : null}
      <div className="species-grid">
        {records.map((species) => (
          <SpeciesCard species={species} key={species.id} onSelect={() => setSelectedSpeciesId(species.id)} />
        ))}
      </div>
    </section>
  );
}

function SpeciesCard({ species, onSelect }: { species: Species; onSelect?: () => void }) {
  const primaryType = species.types[0] ?? "Normal";
  return (
    <button className="species-card" style={{ borderColor: typeColor(primaryType) }} onClick={onSelect} type="button">
      <div className="species-card-glow" style={{ background: typeWash(primaryType) }} />
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
    </button>
  );
}

type DetailTab = "overview" | "stats" | "learnset" | "evolution" | "locations" | "builds" | "source";

function SpeciesDetailView({ detail, onBack }: { detail: NonNullable<ReturnType<typeof buildSpeciesDetailData>>; onBack: () => void }) {
  const [tab, setTab] = useState<DetailTab>("overview");
  const species = detail.species;
  const primaryType = species.types[0] ?? "Normal";
  const tabLabels: Array<[DetailTab, string]> = [
    ["overview", "Overview"],
    ["stats", "Stats"],
    ["learnset", "Learnset"],
    ["evolution", "Evolution"],
    ["locations", "Locations"],
    ["builds", "Builds"],
    ["source", "Source"]
  ];

  return (
    <section className="content-stack detail-shell">
      <button className="ghost-action" type="button" onClick={onBack}>
        <ArrowLeft size={17} aria-hidden="true" />
        Pokedex
      </button>
      <section className="detail-hero" style={{ background: typeColor(primaryType) }}>
        <div>
          <span className="section-kicker detail-kicker">Species profile</span>
          <small>#{species.dexNumber ?? "?"}</small>
          <h2>{species.name}</h2>
          <div className="type-row">
            {species.types.map((type) => <span className="type-chip detail-chip" style={{ background: "rgba(255,255,255,0.22)" }} key={type}>{type}</span>)}
          </div>
          <div className="hero-meta">
            <ConfidenceBadge confidence={species.confidence} />
            <span className="hero-meta-text">{detail.sourceFacts[1]?.value ?? "No source file recorded"}</span>
          </div>
        </div>
        <div className="detail-sprite">
          {species.spritePath ? <img src={species.spritePath} alt="" /> : <span>{species.name.slice(0, 2).toUpperCase()}</span>}
        </div>
      </section>
      <div className="tab-strip" role="tablist" aria-label={`${species.name} detail tabs`}>
        {tabLabels.map(([key, label]) => (
          <button className={tab === key ? "active" : ""} key={key} type="button" onClick={() => setTab(key)}>
            {label}
          </button>
        ))}
      </div>
      {tab === "overview" ? <OverviewTab detail={detail} /> : null}
      {tab === "stats" ? <StatsTab detail={detail} /> : null}
      {tab === "learnset" ? <LearnsetTab detail={detail} /> : null}
      {tab === "evolution" ? <EvolutionTab detail={detail} /> : null}
      {tab === "locations" ? <LocationsTab detail={detail} /> : null}
      {tab === "builds" ? <BuildsTab detail={detail} /> : null}
      {tab === "source" ? <SourceTab detail={detail} /> : null}
    </section>
  );
}

function OverviewTab({ detail }: { detail: NonNullable<ReturnType<typeof buildSpeciesDetailData>> }) {
  const species = detail.species;
  return (
    <section className="panel detail-panel">
      <div className="panel-heading">
        <h2>Overview</h2>
        <ConfidenceBadge confidence={species.confidence} />
      </div>
      <p>{species.description || "No description was extracted for this form."}</p>
      <div className="detail-columns">
        <div>
          <h3>Main Abilities</h3>
          {species.abilities.length ? <div className="pill-list">{species.abilities.map((ability) => <span className="soft-pill" key={ability.id}>{ability.name}</span>)}</div> : <p className="empty compact">No ability references were extracted.</p>}
        </div>
        <div>
          <h3>Sub-Abilities</h3>
          {species.subAbilities.length ? <div className="pill-list">{species.subAbilities.map((ability) => <span className="soft-pill" key={ability.id}>{ability.name}</span>)}</div> : <p className="empty compact">No sub-ability references were extracted.</p>}
        </div>
      </div>
    </section>
  );
}

function StatsTab({ detail }: { detail: NonNullable<ReturnType<typeof buildSpeciesDetailData>> }) {
  return (
    <section className="panel detail-panel">
      <div className="panel-heading">
        <h2>Base Stats</h2>
        {detail.statTotal ? <span className="status-pill">BST {detail.statTotal}</span> : null}
      </div>
      {detail.statRows.length === 0 ? <p className="empty">Stats were not available in generated data.</p> : null}
      <div className="stat-list">
        {detail.statRows.map((row) => (
          <div className="stat-row" key={row.key}>
            <span>{row.label}</span>
            <div className="stat-track"><div style={{ width: `${row.percent}%` }} /></div>
            <strong>{row.value}</strong>
          </div>
        ))}
      </div>
    </section>
  );
}

function LearnsetTab({ detail }: { detail: NonNullable<ReturnType<typeof buildSpeciesDetailData>> }) {
  return (
    <section className="content-stack">
      {detail.groupedLearnset.length === 0 ? <p className="empty">No learnset records were generated for this species.</p> : null}
      {detail.groupedLearnset.map((group) => (
        <section className="panel detail-panel" key={group.label}>
          <h2>{group.label}</h2>
          <div className="move-list">
            {group.moves.slice(0, 80).map((move) => (
              <div className="move-row" key={`${group.label}-${move.id}-${move.level ?? "x"}`}>
                <span>{move.level !== undefined ? `Lv ${move.level}` : group.label}</span>
                <strong>{move.name}</strong>
                <ConfidenceBadge confidence={move.confidence} />
              </div>
            ))}
          </div>
        </section>
      ))}
    </section>
  );
}

function EvolutionTab({ detail }: { detail: NonNullable<ReturnType<typeof buildSpeciesDetailData>> }) {
  return (
    <section className="panel detail-panel">
      <h2>Evolution</h2>
      {detail.evolutions.length === 0 ? <p className="empty">No evolution records were generated for this species.</p> : null}
      <div className="record-list">
        {detail.evolutions.map((evolution) => (
          <article className="record-row" key={evolution.record.id}>
            <div>
              <h3>{evolution.heading}</h3>
              <p>{evolution.methodLabel}</p>
              {evolution.conditionLabel ? <small>{evolution.conditionLabel}</small> : null}
              {evolution.note ? <small>{evolution.note}</small> : null}
            </div>
            <ConfidenceBadge confidence={evolution.record.confidence} />
          </article>
        ))}
      </div>
    </section>
  );
}

function LocationsTab({ detail }: { detail: NonNullable<ReturnType<typeof buildSpeciesDetailData>> }) {
  return (
    <section className="panel detail-panel">
      <h2>Locations</h2>
      {detail.locations.length === 0 ? <p className="empty">No generated encounter/location record currently references this species.</p> : null}
      <div className="record-list">
        {detail.locations.map((location) => (
          <article className="record-row" key={location.location.id}>
            <div>
              <h3>{location.location.name}</h3>
              <p>{location.methods.join(" | ")}</p>
              {location.location.earliestAvailability ? <small>Earliest: {location.location.earliestAvailability}</small> : null}
              {location.notes.slice(0, 2).map((note) => <small key={note}>{note}</small>)}
              <small>{location.encounterCount} matching encounter row(s)</small>
            </div>
            <ConfidenceBadge confidence={location.location.confidence} />
          </article>
        ))}
      </div>
    </section>
  );
}

function BuildsTab({ detail }: { detail: NonNullable<ReturnType<typeof buildSpeciesDetailData>> }) {
  const recommendation = detail.recommendation;
  return (
      <section className="panel detail-panel">
      <div className="panel-heading">
        <h2>Build Preview</h2>
        <ConfidenceBadge confidence={recommendation.confidence} />
      </div>
      <dl className="facts">
        <div><dt>Role</dt><dd>{recommendation.role}</dd></div>
        <div><dt>Nature</dt><dd>{recommendation.nature ?? "Uncertain"}</dd></div>
        <div><dt>Legality</dt><dd>{recommendation.legality.status}</dd></div>
        <div><dt>Main ability</dt><dd>{recommendation.mainAbility ?? "Uncertain"}</dd></div>
        <div><dt>Item</dt><dd>{recommendation.item ?? "No confirmed item recommendation yet"}</dd></div>
        <div><dt>EV spread</dt><dd>{recommendation.evSpread ? Object.entries(recommendation.evSpread).map(([stat, value]) => `${stat} ${value}`).join(", ") : "Uncertain"}</dd></div>
      </dl>
      {recommendation.subAbilities.length ? (
        <>
          <h3>Sub-Abilities</h3>
          <div className="pill-list">{recommendation.subAbilities.map((ability) => <span className="soft-pill" key={ability}>{ability}</span>)}</div>
        </>
      ) : null}
      {recommendation.moves.length ? (
        <div className="pill-list">{recommendation.moves.map((move) => <span className="soft-pill" key={move}>{move}</span>)}</div>
      ) : <p className="empty">No confirmed move options are available for this preview.</p>}
      <p className="build-reasoning">{recommendation.reasoning}</p>
      <h3>Legality basis</h3>
      <ul className="tight-list">
        {recommendation.legality.basis.map((basis) => <li key={basis}>{basis}</li>)}
        {recommendation.legality.warnings.map((warning) => <li key={warning}>{warning}</li>)}
      </ul>
    </section>
  );
}

function SourceTab({ detail }: { detail: NonNullable<ReturnType<typeof buildSpeciesDetailData>> }) {
  return (
    <section className="panel detail-panel">
      <div className="panel-heading">
        <h2>Source</h2>
        <ConfidenceBadge confidence={detail.species.confidence} />
      </div>
      <div className="record-list">
        {detail.sourceFacts.map((fact) => (
          <article className="record-row" key={`fact-${fact.label}`}>
            <div>
              <h3>{fact.label}</h3>
              <p>{fact.value}</p>
            </div>
            <ConfidenceBadge confidence={fact.confidence} />
          </article>
        ))}
        {detail.species.source.map((source) => (
          <article className="record-row" key={`${source.sourceFile}-${source.parser}-${source.sourcePath ?? ""}`}>
            <div>
              <h3>{source.sourceFile}</h3>
              <p>{source.parser}</p>
              <small>{source.sourcePath ?? "No source path recorded"}</small>
              {source.notes.map((note) => <small key={note}>{note}</small>)}
            </div>
            <ConfidenceBadge confidence={source.confidence} />
          </article>
        ))}
      </div>
      {detail.sourceWarnings.length ? <ul className="tight-list">{detail.sourceWarnings.map((warning) => <li key={warning}>{warning}</li>)}</ul> : null}
      <p className="notice">Sprites are bundled from local generated assets for private/mobile builds. Public releases need rights/permission or user-provided sprite packs.</p>
    </section>
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

function SaveManagerPage({ data, save, onSaveLoaded }: { data: AppData; save?: ParsedSave; onSaveLoaded: (save: ParsedSave | undefined) => void }) {
  const [error, setError] = useState<string | undefined>();
  const [candidates, setCandidates] = useState<ParsedSave[]>([]);
  const lookupContext = useMemo(() => buildSaveParserLookupContext(data), [data]);

  async function onFile(file?: File) {
    if (!file) return;
    setError(undefined);
    try {
      const result = await analyzeSaveArtifact(file, lookupContext);
      setCandidates(result.candidates);
      onSaveLoaded(result.selected);
    } catch (err) {
      setCandidates([]);
      setError(err instanceof Error ? err.message : "Could not analyze save file.");
    }
  }

  return (
    <section className="content-stack">
      <section className="panel save-hero">
        <div>
          <span className="section-kicker">Save intake</span>
          <h2>Read-only local inspection</h2>
          <p>Load a local `.sav`, `.srm`, `.gz`, or `.zip` mobile export to inspect metadata, verify hashes, and export debug JSON without mutating a single byte.</p>
        </div>
        <label className="drop-zone">
          <FileSearch size={28} aria-hidden="true" />
          <span>Choose a local save or mobile GBA export for read-only analysis</span>
          <input type="file" accept=".sav,.srm,.gz,.zip,application/octet-stream,application/zip,application/gzip" onChange={(event) => onFile(event.target.files?.[0])} />
        </label>
      </section>
      {error ? <p className="error">{error}</p> : null}
      {save ? (
        <>
          {candidates.length > 1 ? (
            <section className="panel">
              <div className="panel-heading">
                <h2>Imported save candidates</h2>
                <span className="status-pill">{candidates.length} distinct candidate(s)</span>
              </div>
              <p className="notice">This archive contained multiple distinct save candidates. The app loaded the strongest current candidate automatically, and you can switch between them below.</p>
              <div className="record-list">
                {candidates.map((candidate) => {
                  const isActive = candidate.metadata.sha256 === save.metadata.sha256;
                  return (
                    <button className={`record-row candidate-row ${isActive ? "active" : ""}`} key={candidate.metadata.sha256} onClick={() => onSaveLoaded(candidate)} type="button">
                      <div>
                        <h3>{candidate.metadata.fileName}</h3>
                        <p>{candidate.party.length} party row(s), {candidate.boxes.reduce((sum, box) => sum + box.length, 0)} PC row(s)</p>
                        <small>{candidate.warnings[0] ?? "No warnings recorded."}</small>
                      </div>
                      <ConfidenceBadge confidence={candidate.metadata.parserConfidence} />
                    </button>
                  );
                })}
              </div>
            </section>
          ) : null}
          <section className="save-summary-grid">
            <article className="metric">
              <span>Parser confidence</span>
              <strong>{save.metadata.parserConfidence}</strong>
            </article>
            <article className="metric">
              <span>Size family</span>
              <strong>{save.metadata.sizeFamily ?? save.metadata.likelyFormat}</strong>
            </article>
            <article className="metric">
              <span>Candidate blocks</span>
              <strong>{save.research?.blockCandidates.length ?? 0}</strong>
            </article>
            <article className="metric">
              <span>Candidate offset groups</span>
              <strong>{save.research?.offsetGroups.length ?? 0}</strong>
            </article>
            <article className="metric">
              <span>Parsed party rows</span>
              <strong>{save.party.length}</strong>
            </article>
            <article className="metric">
              <span>Parsed PC rows</span>
              <strong>{save.boxes.reduce((sum, box) => sum + box.length, 0)}</strong>
            </article>
          </section>
          <section className="panel">
            <div className="panel-heading">
              <h2>{save.metadata.fileName}</h2>
              <ConfidenceBadge confidence={save.metadata.parserConfidence} />
            </div>
            <dl className="facts">
              <div><dt>Size</dt><dd>{save.metadata.fileSize} bytes</dd></div>
              <div><dt>Format</dt><dd>{save.metadata.likelyFormat}</dd></div>
              <div><dt>Size family</dt><dd>{save.metadata.sizeFamily ?? "Unknown"}</dd></div>
              <div><dt>SHA-256</dt><dd className="hash">{save.metadata.sha256}</dd></div>
            </dl>
            <pre className="hex">{save.metadata.hexPreview}</pre>
            <button className="primary" onClick={() => downloadText("save-debug.json", exportSaveDebugJson(save))}>Export debug JSON</button>
            <ul className="tight-list">{save.warnings.map((warning) => <li key={warning}>{warning}</li>)}</ul>
          </section>
          {save.party.length > 0 ? (
            <section className="panel">
              <div className="panel-heading">
                <h2>Parsed party preview</h2>
                <span className="status-pill">source-backed, fixture pending</span>
              </div>
              <div className="record-list">
                {save.party.map((pokemon) => (
                  <article className="record-row" key={pokemon.id}>
                    <div>
                      <h3>
                        {pokemon.slot ? `Slot ${pokemon.slot}: ` : ""}
                        {pokemon.speciesName}
                      </h3>
                      <p>{pokemon.level !== undefined ? `Level ${pokemon.level}` : "Level unresolved"}</p>
                      {pokemon.mainAbility ? <small>Main ability: {pokemon.mainAbility}</small> : null}
                      {pokemon.heldItem ? <small>Held item: {pokemon.heldItem}</small> : null}
                      {pokemon.moves.length ? <small>Moves: {pokemon.moves.join(", ")}</small> : null}
                      {pokemon.warnings.map((warning) => <small key={warning}>{warning}</small>)}
                    </div>
                    <ConfidenceBadge confidence={pokemon.confidence} />
                  </article>
                ))}
              </div>
            </section>
          ) : null}
          {save.boxes.some((box) => box.length > 0) ? (
            <section className="panel">
              <div className="panel-heading">
                <h2>Parsed PC box preview</h2>
                <span className="status-pill">source-backed, fixture pending</span>
              </div>
              <div className="record-list">
                {save.boxes.slice(0, 3).map((box, index) => (
                  <article className="record-row" key={`box-${index + 1}`}>
                    <div>
                      <h3>Box {index + 1}</h3>
                      <p>{box.length} parsed row(s)</p>
                      <small>{box.slice(0, 3).map((pokemon) => pokemon.speciesName).join(", ") || "No resolved species yet"}</small>
                      {box.some((pokemon) => pokemon.warnings.length > 0) ? <small>{box.flatMap((pokemon) => pokemon.warnings).slice(0, 2).join(" ")}</small> : null}
                    </div>
                    <ConfidenceBadge confidence={box.some((pokemon) => pokemon.confidence === "medium") ? "medium" : "low"} />
                  </article>
                ))}
              </div>
            </section>
          ) : null}
          {save.research ? (
            <>
              <section className="panel">
                <div className="panel-heading">
                  <h2>Research notes</h2>
                  <span className="status-pill">{save.research.fixtureStatus} fixture status</span>
                </div>
                <ul className="tight-list">
                  {save.research.notes.map((note) => <li key={note}>{note}</li>)}
                  {save.research.provenPartyFields.length === 0 ? <li>No party fields are currently proven enough to expose as parsed save data.</li> : null}
                </ul>
              </section>
              <section className="panel">
                <div className="panel-heading">
                  <h2>Candidate offset groups</h2>
                  <span className="status-pill">{save.research.offsetGroups.length} groups</span>
                </div>
                <div className="record-list">
                  {save.research.offsetGroups.map((group) => (
                    <article className="record-row" key={group.id}>
                      <div>
                        <h3>{group.label}</h3>
                        <p>{formatOffsetRange(group.start, group.end)}</p>
                        <small>{group.reason}</small>
                      </div>
                      <ConfidenceBadge confidence={group.confidence} />
                    </article>
                  ))}
                </div>
              </section>
              <section className="panel">
                <div className="panel-heading">
                  <h2>Block candidates</h2>
                  <span className="status-pill">{save.research.blockSize.toString(16).toUpperCase()}h block size</span>
                </div>
                <div className="record-list">
                  {save.research.blockCandidates.slice(0, 12).map((block) => (
                    <article className="record-row compact-record" key={`${block.index}-${block.start}`}>
                      <div>
                        <h3>{block.label}</h3>
                        <p>{formatOffsetRange(block.start, block.end)} | {block.nonZeroBytes} non-zero byte(s)</p>
                        <small>
                          {block.bank !== "single" ? `Bank ${block.bank.toUpperCase()}` : "Single-bank candidate"} | Distinct bytes {block.distinctBytes} | Printable ratio {block.printableRatio}
                        </small>
                        {block.notes.map((note) => <small key={note}>{note}</small>)}
                      </div>
                      <ConfidenceBadge confidence={block.confidence} />
                    </article>
                  ))}
                </div>
              </section>
            </>
          ) : null}
        </>
      ) : null}
      <section className="panel">
        <div className="panel-heading">
          <h2>Fixture readiness</h2>
          <span className="status-pill">Read-only research only</span>
        </div>
        <ul className="tight-list">
          <li>Needed milestones: clean new game, starter chosen, one catch, one PC deposit, first badge.</li>
          <li>Randomized moves and randomized abilities/sub-abilities need separate fixtures if those modes matter.</li>
          <li>Parser confidence stays low for party, PC, progression, and randomizer flags until repeated byte-comparison evidence exists.</li>
        </ul>
      </section>
    </section>
  );
}

function TeamBuilderPage({ data, currentSave }: { data: AppData; currentSave?: ParsedSave }) {
  const [advanced, setAdvanced] = useState(false);
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
  const teamResolution = resolveOwnedTeam(currentSave, mockOwned);
  const owned = teamResolution.ownedPokemon;
  const reserves = teamResolution.reservePokemon;
  const usingMockTeam = teamResolution.source === "mock-fallback";
  const recommendations = recommendBuilds({
    ownedPokemon: owned,
    species: data.species,
    learnsets: data.learnsets,
    levelCap: currentSave?.progression?.currentLevelCap ?? 20,
    randomizerSuspected: currentSave?.settings?.randomAbilities || currentSave?.settings?.randomMoves || currentSave?.settings?.randomSubAbilities || usingMockTeam
  });
  const teamSpecies = owned
    .map((owned) => data.species.find((species) => species.id === owned.speciesId))
    .filter((species): species is Species => Boolean(species));
  const unresolvedOwned = owned.filter((pokemon) => !pokemon.speciesId || !data.species.find((species) => species.id === pokemon.speciesId));
  const reserveSpecies = reserves
    .map((owned) => data.species.find((species) => species.id === owned.speciesId))
    .filter((species): species is Species => Boolean(species));
  const unresolvedReserves = reserves.filter((pokemon) => !pokemon.speciesId || !data.species.find((species) => species.id === pokemon.speciesId));
  const coverage = analyzeDefensiveCoverage(teamSpecies);
  return (
    <section className="content-stack">
      <p className="notice">{usingMockTeam ? "Using mock owned Pokemon until real save party/PC parsing is fixture-confirmed. No Pokemon are created in saves and no save writing exists." : "Using parsed party data from the currently loaded local save. Party parsing is still provisional until fixture-backed offsets are confirmed."}</p>
      <section className="panel team-hero">
        <div>
          <span className="section-kicker">Team operations</span>
          <h2>Coverage and legality at a glance</h2>
          <p>Use saved party data when available, otherwise stay in a clearly marked mock-owned preview until fixture-backed parsing is ready.</p>
        </div>
        <div className="hero-actions">
          <span className="soft-pill">Deterministic recommender</span>
          <span className="soft-pill">Confidence visible</span>
          <span className="soft-pill">No invented legality</span>
        </div>
      </section>
      {currentSave ? (
        <section className="panel">
          <div className="panel-heading">
            <h2>Save context</h2>
            <ConfidenceBadge confidence={currentSave.metadata.parserConfidence} />
          </div>
          <dl className="facts">
            <div><dt>Loaded file</dt><dd>{currentSave.metadata.fileName}</dd></div>
            <div><dt>Format</dt><dd>{currentSave.metadata.likelyFormat}</dd></div>
            <div><dt>Data source</dt><dd>{teamResolution.source === "parsed-save" ? "Parsed save party" : "Mock fallback roster"}</dd></div>
            <div><dt>Party rows</dt><dd>{currentSave.party.length}</dd></div>
            <div><dt>PC rows</dt><dd>{reserves.length}</dd></div>
          </dl>
          <ul className="tight-list">{teamResolution.warnings.map((warning) => <li key={warning}>{warning}</li>)}</ul>
        </section>
      ) : (
        <section className="panel">
          <div className="panel-heading">
            <h2>Team data source</h2>
            <span className="status-pill">mock fallback</span>
          </div>
          <ul className="tight-list">{teamResolution.warnings.map((warning) => <li key={warning}>{warning}</li>)}</ul>
        </section>
      )}
      <div className="panel-heading">
        <h2>Owned Preview</h2>
        <button className="primary secondary" type="button" onClick={() => setAdvanced((value) => !value)}>{advanced ? "Simple" : "Advanced"}</button>
      </div>
      <div className="team-roster">
        {teamSpecies.map((species) => (
          <SpeciesCard species={species} key={species.id} />
        ))}
        {unresolvedOwned.map((pokemon) => (
          <article className="panel unresolved-party-card" key={pokemon.id}>
            <div className="panel-heading">
              <h3>{pokemon.speciesName}</h3>
              <ConfidenceBadge confidence={pokemon.confidence} />
            </div>
            <p>Parsed party row exists, but species mapping is incomplete.</p>
            {pokemon.level !== undefined ? <small>Level {pokemon.level}</small> : null}
            {pokemon.warnings.map((warning) => <small key={warning}>{warning}</small>)}
          </article>
        ))}
      </div>
      {currentSave && reserves.length > 0 ? (
        <section className="panel">
          <div className="panel-heading">
            <h2>Reserve Boxes</h2>
            <span className="status-pill">{reserves.length} parsed PC row(s)</span>
          </div>
          <p className="notice">Reserve rows come from source-backed PC parsing and stay medium/low confidence until fixture-backed validation proves the storage layout.</p>
          <div className="team-roster reserve-roster">
            {reserveSpecies.slice(0, 12).map((species, index) => (
              <SpeciesCard species={species} key={`reserve-${species.id}-${index}`} />
            ))}
            {unresolvedReserves.slice(0, 6).map((pokemon) => (
              <article className="panel unresolved-party-card" key={`reserve-${pokemon.id}`}>
                <div className="panel-heading">
                  <h3>{pokemon.speciesName}</h3>
                  <ConfidenceBadge confidence={pokemon.confidence} />
                </div>
                <p>Parsed reserve row exists, but species mapping is incomplete.</p>
                {pokemon.box ? <small>Box {pokemon.box}</small> : null}
                {pokemon.slot ? <small>Slot {pokemon.slot}</small> : null}
                {pokemon.warnings.map((warning) => <small key={warning}>{warning}</small>)}
              </article>
            ))}
          </div>
        </section>
      ) : null}
      <section className="panel">
        <h2>Defensive Coverage</h2>
        {teamSpecies.length === 0 ? <p className="empty compact">Coverage stays unavailable until at least one team member resolves to parsed species data.</p> : null}
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
          <article className="record-row recommendation-row" key={recommendation.pokemonId}>
            <div>
              <h3>{recommendation.speciesName}</h3>
              <p>{recommendation.role} - {recommendation.nature ?? "Nature uncertain"}</p>
              {advanced && recommendation.mainAbility ? <small>Main ability: {recommendation.mainAbility}</small> : null}
              {advanced && recommendation.subAbilities.length ? <small>Sub-abilities: {recommendation.subAbilities.join(", ")}</small> : null}
              {advanced && recommendation.evSpread ? <small>EVs: {Object.entries(recommendation.evSpread).map(([stat, value]) => `${stat} ${value}`).join(", ")}</small> : null}
              {recommendation.moves.length ? <small>Moves: {recommendation.moves.join(", ")}</small> : null}
              <small>{recommendation.reasoning}</small>
              {advanced ? (
                <>
                  <small>Legality: {recommendation.legality.status}</small>
                  {recommendation.legality.basis.length ? <small>Basis: {recommendation.legality.basis.join("; ")}</small> : null}
                  {recommendation.legality.warnings.length ? <small>Warnings: {recommendation.legality.warnings.join(" ")}</small> : null}
                </>
              ) : recommendation.legality.warnings.length ? <small>{recommendation.legality.warnings.join(" ")}</small> : null}
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

function formatOffsetRange(start: number, end: number): string {
  const startHex = `0x${start.toString(16).padStart(6, "0")}`;
  const endHex = `0x${Math.max(start, end - 1).toString(16).padStart(6, "0")}`;
  return `${startHex} - ${endHex}`;
}
