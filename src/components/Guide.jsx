import { GUIDE_SECTION } from "../data/content.js";
import Icon from "../data/Icon.jsx";
import { Eyebrow } from "./ui.jsx";

export default function Guide() {
  const { badge, title, body1, body2, points, image, imageAlt, role, name } = GUIDE_SECTION;

  return (
    <section className="section-py">
      <div className="container-x flex flex-col gap-8 min-[1100px]:flex-row min-[1100px]:justify-between min-[1100px]:gap-6">
        {/* left column */}
        <div className="w-full min-w-0" style={{ maxWidth: 610 }}>
          <Eyebrow>{badge}</Eyebrow>
          <h2 className="t-h2 mt-2">
            {title.map((line) => (
              <span key={line} className="block">
                {line}
              </span>
            ))}
          </h2>
          <p className="t-body mt-4 max-w-[480px]">{body1}</p>
          <p className="t-body mt-2 max-w-[480px]">{body2}</p>

          <div className="mt-8 grid grid-cols-1 gap-6 min-[639.98px]:mt-12 min-[639.98px]:grid-cols-3">
            {points.map((pt) => (
              <div key={pt.title} className="min-w-0">
                <Icon id={pt.icon} size={36} />
                <h4 className="t-h4 mt-4">{pt.title}</h4>
                <p className="t-body mt-1">{pt.body}</p>
              </div>
            ))}
          </div>
        </div>

        {/* lead-guide photo card */}
        <div className="relative h-[380px] w-full overflow-hidden rounded-lg min-[639.98px]:h-[491px] min-[1100px]:w-[609px] min-[1100px]:shrink-0">
          <img src={image} alt={imageAlt} className="absolute inset-0 h-full w-full object-cover" />
          <div className="absolute inset-x-0 bottom-0 p-4">
            <Eyebrow color="var(--color-mist)">{role}</Eyebrow>
            <h4 className="t-h4 mt-1 text-mist">{name}</h4>
          </div>
        </div>
      </div>
    </section>
  );
}
