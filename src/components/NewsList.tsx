import type { NewsItem } from "@/lib/mockData";
import { sentimentClass } from "@/lib/format";

type NewsListProps = {
  title: string;
  description: string;
  items: NewsItem[];
};

export function NewsList({ title, description, items }: NewsListProps) {
  return (
    <section className="contentSection">
      <div className="sectionHeader">
        <div>
          <p className="eyebrow">{description}</p>
          <h2>{title}</h2>
        </div>
      </div>

      <div className="newsList">
        {items.map((item) => (
          <a
            className="newsItem"
            href={item.url}
            key={item.id}
            rel="noopener noreferrer"
            target="_blank"
          >
            <div className="newsMeta">
              <span className={`pill ${sentimentClass(item.sentiment)}`}>{item.impact}</span>
              <span>{item.source}</span>
              <span>{item.date}</span>
            </div>
            <h3>{item.title}</h3>
            <p>{item.summary}</p>
          </a>
        ))}
      </div>
    </section>
  );
}
