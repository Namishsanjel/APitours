import { useEffect, useRef, useState } from "react";

/** The 11x7 chevron the booking selects already use, pointed down. */
function ChevronDown() {
  return (
    <svg className="f-chevron" width="11" height="7" viewBox="0 0 11 7" fill="none" aria-hidden="true">
      <path
        d="M1 1 5.5 5.6 10 1"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function Check() {
  return (
    <svg width="13" height="10" viewBox="0 0 13 10" fill="none" aria-hidden="true">
      <path
        d="M1 4.8 4.7 8.4 12 1"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ArrowRight() {
  return (
    <svg width="14" height="11" viewBox="0 0 14 11" fill="none" aria-hidden="true">
      <path
        d="M1 5.5h11M8.4 1.8l3.8 3.7-3.8 3.7"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ArrowLeft() {
  return (
    <svg width="14" height="11" viewBox="0 0 14 11" fill="none" aria-hidden="true">
      <path
        d="M13 5.5H2M5.6 1.8 1.8 5.5l3.8 3.7"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * The booking form, one step at a time. Field labels and options still come
 * from the page data; this is only the order they are asked in, and which
 * fields each step owns.
 *
 * Only the first step can actually block — everything after it is a select
 * that already carries a default, or a free-text note that is optional, so
 * there is nothing there to refuse progress over.
 */
const STEPS = [
  { id: "you", title: "Your details", fields: ["name", "email"] },
  { id: "trip", title: "The trip", fields: ["destination", "date"] },
  { id: "prefs", title: "Your preferences", fields: ["group", "preferences", "budget"] },
  { id: "note", title: "Anything else?", fields: ["message"] },
];

/** Deliberately loose — enough to catch a typo, not to police real addresses. */
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function Field({ label, htmlFor, error, children }) {
  return (
    <div className="flex flex-col gap-[10px]">
      <label className="f-label" htmlFor={htmlFor}>
        {label}
      </label>
      {children}
      {error ? (
        <p id={`${htmlFor}-error`} className="f-error">
          {error}
        </p>
      ) : null}
    </div>
  );
}

/**
 * The dot track. Each connector belongs to the step it leads into, so it fills
 * as soon as the step before it has been reached. Steps already visited stay
 * clickable — going back should never mean walking forward again first.
 */
function StepTrack({ current, furthest, onJump }) {
  return (
    <ol aria-label="Trip request progress" className="flex items-center">
      {STEPS.map((s, i) => {
        const state = i < current ? "done" : i === current ? "current" : "todo";
        const reachable = i <= furthest;

        return (
          <li key={s.id} className={`flex items-center gap-2 ${i === 0 ? "" : "flex-1"}`}>
            {i > 0 ? (
              <span
                aria-hidden="true"
                data-state={i <= current ? "done" : "todo"}
                className="h-[2px] flex-1 rounded-[2px] bg-ink/15"
              />
            ) : null}
            <button
              type="button"
              disabled={!reachable}
              onClick={() => onJump(i)}
              data-state={state}
              aria-current={i === current ? "step" : undefined}
              aria-label={`Step ${i + 1} of ${STEPS.length}: ${s.title}`}
              className="step-dot flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border-0 p-0"
            >
              {state === "done" ? <Check /> : <span className="t-eyebrow leading-none">{i + 1}</span>}
            </button>
          </li>
        );
      })}
    </ol>
  );
}

/**
 * The plan-your-trip booking form. The whole form stays one <form> and one
 * controlled value set, so stepping back and forth never loses an answer and
 * the last step submits the lot.
 */
export default function TripForm({ form, destinations }) {
  const [step, setStep] = useState(0);
  // furthest step reached — drives which dots are clickable
  const [furthest, setFurthest] = useState(0);
  const [errors, setErrors] = useState({});
  const [values, setValues] = useState(() => ({
    name: "",
    email: "",
    destination: destinations[0] ?? "",
    date: "",
    group: form.group.options[0] ?? "",
    preferences: form.preferences.options[0] ?? "",
    budget: form.budget.options[0] ?? "",
    message: "",
  }));

  // the step title, so focus lands on the new step when it changes
  const heading = useRef(null);
  const settled = useRef(false);
  const last = STEPS.length - 1;
  const current = STEPS[step];

  // Runs after the DOM settles rather than inside the click, so the heading
  // already reads as the step just opened. Skipped on mount — that would pull
  // focus into the form before the visitor has asked for it.
  useEffect(() => {
    if (!settled.current) {
      settled.current = true;
      return;
    }
    heading.current?.focus();
  }, [step]);

  const optionsOf = (name) => (name === "destination" ? destinations : form[name].options);

  const set = (name) => (e) => {
    const { value } = e.target;
    setValues((v) => ({ ...v, [name]: value }));
    // clear the complaint as soon as they start fixing it
    if (errors[name]) setErrors((prev) => omit(prev, name));
  };

  /** Only "Your details" holds anything that can be left empty. */
  const validate = (at) => {
    const found = {};
    const on = STEPS[at].fields;

    if (on.includes("name") && !values.name.trim()) found.name = "Please tell us your name";
    if (on.includes("email")) {
      const email = values.email.trim();
      if (!email) found.email = "We need an email to reply to";
      else if (!EMAIL.test(email)) found.email = "That email address doesn't look right";
    }

    return found;
  };

  const goTo = (next) => {
    setStep(next);
    setFurthest((f) => Math.max(f, next));
  };

  const advance = () => {
    const found = validate(step);
    setErrors(found);
    if (Object.keys(found).length) return;
    if (step < last) goTo(step + 1);
  };

  /** One control per field name — the only three shapes this form has. */
  const control = (name) => {
    const spec = form[name];
    if (!spec) return null;

    const id = `trip-${name}`;
    const invalid = Boolean(errors[name]);
    const options = optionsOf(name);
    const shared = {
      id,
      name,
      value: values[name],
      onChange: set(name),
      "aria-invalid": invalid || undefined,
      "aria-describedby": invalid ? `${id}-error` : undefined,
    };
    const fieldClass = `f-control${invalid ? " f-invalid" : ""}`;

    let input;
    if (options) {
      input = (
        <div className="relative">
          <select {...shared} className={`${fieldClass} f-select`}>
            {options.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
          <ChevronDown />
        </div>
      );
    } else if (name === "message") {
      input = <textarea {...shared} className={`${fieldClass} f-textarea`} placeholder={spec.placeholder} />;
    } else {
      const type = name === "email" ? "email" : name === "date" ? "date" : "text";
      input = (
        <input {...shared} type={type} className={`${fieldClass} f-input`} placeholder={spec.placeholder} />
      );
    }

    return (
      <Field key={name} label={spec.label} htmlFor={id} error={errors[name]}>
        {input}
      </Field>
    );
  };

  return (
    <form
      noValidate
      className="flex w-full min-w-0 flex-col rounded-lg bg-cream p-6"
      style={{ maxWidth: 520 }}
      onKeyDown={(e) => {
        // Enter walks the steps instead of submitting from step one, but the
        // note field still needs it for new lines
        if (e.key !== "Enter" || step >= last || e.target.tagName === "TEXTAREA") return;
        e.preventDefault();
        advance();
      }}
      onSubmit={(e) => e.preventDefault()}
    >
      <StepTrack current={step} furthest={furthest} onJump={goTo} />

      <p className="t-eyebrow mt-6 text-smoke">
        Step {step + 1} of {STEPS.length}
      </p>
      <h3 ref={heading} tabIndex={-1} className="t-h3s mt-1 outline-none">
        {current.title}
      </h3>

      <div key={current.id} className="step-in mt-5 flex flex-col gap-4">
        {current.fields.map(control)}
      </div>

      <div className="mt-6 flex items-center gap-3">
        {step > 0 ? (
          <button type="button" onClick={() => goTo(step - 1)} className="btn btn-ghost gap-2">
            <ArrowLeft />
            Back
          </button>
        ) : null}

        {step < last ? (
          <button type="button" onClick={advance} className="btn btn-dark ml-auto gap-2">
            Continue
            <ArrowRight />
          </button>
        ) : (
          <button type="submit" className="btn btn-dark ml-auto h-[51px] flex-1">
            {form.submit}
          </button>
        )}
      </div>
    </form>
  );
}

/** Drop one key, without mutating. */
function omit(obj, key) {
  const next = { ...obj };
  delete next[key];
  return next;
}