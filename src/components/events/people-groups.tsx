import Image from "next/image";
import Link from "next/link";

export type PublicPeopleGroup = {
  id: string;
  name: string;
  members: {
    id: string;
    name: string;
    title: string;
    image: string;
    link: string;
  }[];
};

/** Shared by event and training-course pages so grouping, keys and order stay consistent. */
export function PeopleGroups({ groups }: { groups: PublicPeopleGroup[] }) {
  return (
    <>
      {groups
        .filter((group) => group.members.length)
        .map((group) => (
          <section className="mb-10" key={group.id} aria-label={group.name}>
            <h2 className="mb-6 break-words border-b border-outline-variant/20 pb-3 text-xl font-semibold">
              {group.name}
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {group.members.map((person) => (
                <div
                  className="flex min-w-0 items-center gap-5 bg-surface-container-lowest p-5 ghost-border"
                  key={person.id}
                >
                  <div className="relative size-16 shrink-0 overflow-hidden">
                    <Image
                      alt={person.name}
                      className="object-cover grayscale"
                      fill
                      sizes="64px"
                      src={person.image}
                    />
                  </div>
                  <div className="min-w-0">
                    <h3 className="mb-1 break-words text-sm font-semibold">
                      {person.link ? (
                        <Link
                          className="underline-offset-4 hover:text-primary hover:underline"
                          href={person.link}
                          rel="noreferrer"
                          target="_blank"
                        >
                          {person.name}
                        </Link>
                      ) : (
                        person.name
                      )}
                    </h3>
                    {person.title ? (
                      <p className="break-words text-xs text-on-surface-variant">
                        {person.title}
                      </p>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}
    </>
  );
}
