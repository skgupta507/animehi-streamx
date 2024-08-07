import { auth } from "@/auth"
import { queryAnilist } from "@/lib/anilist"
import { profileQuery } from "@/lib/graphql"
import { accessToken, getBookmark, getContinueWatching } from "@/lib/metrics"
import { notFound } from "next/navigation"
import NextImage from "@/components/ui/image"
import { FaSearch } from "react-icons/fa"
import { Button, buttonVariants } from "@/components/ui/button"
import { BiSolidEditAlt } from "react-icons/bi"
import { SiAnilist } from "react-icons/si"
// import ContinueWatching from "@/components/continue-watching"
import Link from "next/link"
import React from "react"
import { transformedTitle } from "@/lib/utils"
import type { Metadata } from "next"
import { env } from "@/env.mjs"

export async function generateMetadata({
  params,
}: {
  params: {
    params: string[]
  }
}): Promise<Metadata | undefined> {
  const [userName, userId] = params.params
  const token = await accessToken()

  const profile = await queryAnilist(profileQuery, token!, {
    username: userName,
  })

  if (!profile) {
    return
  }

  const title = profile.data.MediaListCollection.user.name
  const description = profile.data.MediaListCollection.user.about
  const imageUrl = profile.data.MediaListCollection.user.avatar.large

  return {
    title: `AnimeHi - ${title}'s profile`,
    description,
    openGraph: {
      title,
      description,
      type: "profile",
      url: `${env.NEXT_PUBLIC_APP_URL}/user/${userName}/${userId}`,
      images: [
        {
          url: `${imageUrl}`,
          width: 600,
          height: 400,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [
        {
          url: `${imageUrl}`,
          width: 600,
          height: 400,
        },
      ],
    },
  }
}
const Profile = async ({
  params,
}: {
  params: {
    params: string[]
  }
}) => {
  const [userName, userId] = params.params
  const session = await auth()

  if (!userId || !userName) notFound()

  const token = await accessToken()

  const profile = await queryAnilist(profileQuery, token!, {
    username: userName,
  })

  if (profile) {
    const bookMarks = await getBookmark(userId)
    const watching = await getContinueWatching()
    const time = convertMinutesToDays(
      profile.data.MediaListCollection.user.statistics.anime.minutesWatched
    )

    const isCurrentUser =
      session?.user.name === profile.data.MediaListCollection.user.name

    console.log(profile.data.MediaListCollection.user)

    return (
      <div className="relative flex flex-col px-[2%]">
        <div className="absolute -top-32 left-0 h-[240px] w-full bg-secondary/10"></div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="mt-16 flex flex-col gap-4">
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-4">
                <NextImage
                  classnamecontainer="w-24 h-24 relative"
                  fill
                  src={profile.data.MediaListCollection.user.avatar.large ?? ""}
                  alt=""
                  style={{ objectFit: "cover" }}
                />

                <h2 className="-mt-3 text-2xl">
                  {profile.data.MediaListCollection.user.name}
                </h2>
              </div>

              <div className="flex items-center gap-3">
                {isCurrentUser ? (
                  <Link
                    href="https://anilist.co/settings"
                    className={buttonVariants({
                      className: "bg-secondary/20 hover:",
                    })}
                  >
                    <BiSolidEditAlt />
                    Edit Profile
                  </Link>
                ) : null}

                <div className="flex items-center gap-2">
                  <SiAnilist />
                  <span>Create At: </span>
                  <UnixTimeConverter
                    unixTime={profile.data.MediaListCollection.user.createdAt}
                  />
                </div>
              </div>
            </div>
            <div className="max-h-14 overflow-hidden rounded-md bg-secondary/30 p-3">
              {profile.data.MediaListCollection.user.about ? (
                <div
                  dangerouslySetInnerHTML={{
                    __html: profile.data.MediaListCollection.user.about,
                  }}
                />
              ) : (
                <span>No description: </span>
              )}
            </div>
            <div className="flex items-center justify-center gap-3 rounded-md bg-secondary/30 p-3 text-sm">
              <div className="flex flex-col items-center gap-1">
                <span className="text-primary">
                  {
                    profile.data.MediaListCollection.user.statistics.anime
                      .episodesWatched
                  }
                </span>
                <span>Total Episodes</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <span className="text-primary">
                  {profile.data.MediaListCollection.user.statistics.anime.count}
                </span>
                <span>Total Anime</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                {time?.days ? (
                  <>
                    <span className="text-primary">{time.days}</span>
                    <span>Days Watched</span>
                  </>
                ) : (
                  <>
                    <span className="text-primary">{time.hours}</span>
                    <span>hours</span>
                  </>
                )}
              </div>
            </div>
            <div className="w-full space-y-3">
              <h4 className="text-left text-base md:text-2xl">Bookmark</h4>
              <div className="bg-secondary/30">
                <div className="flex justify-between p-3">
                  <div>Title</div>
                </div>
                {bookMarks.length !== 0 ? (
                  bookMarks.map((bookMark) => (
                    <CardItem
                      key={bookMark.id}
                      id={bookMark.anilistId}
                      progress=""
                      episodes=""
                      title={bookMark.title}
                      cover={bookMark.image}
                    />
                  ))
                ) : (
                  <div className="my-2 text-center">No Bookmark</div>
                )}
              </div>
            </div>
            {isCurrentUser ? (
              <div className="w-full space-y-3">
                <h4 className="text-left text-base md:text-2xl">
                  Continue Watching on AnimeHi
                </h4>
                <div className="bg-secondary/30">
                  <div className="flex justify-between p-3">
                    <div>Title</div>
                  </div>
                  {watching?.length !== 0 ? (
                    watching?.map((item) => (
                      <CardItem
                        key={item.id}
                        id={item.anilistId}
                        progress=""
                        episodes=""
                        title={item.title}
                        cover={item.image}
                      >
                        <div className="text-sm text-muted-foreground">
                          Watching Episode {item.episodeNumber}
                        </div>
                      </CardItem>
                    ))
                  ) : (
                    <div className="my-2 text-center">No Bookmark</div>
                  )}
                </div>
              </div>
            ) : null}

            {/* <div>{session ? <ContinueWatching /> : null}</div> */}
          </div>
          <div className="mt-4 w-full space-y-3 md:mt-32">
            {profile.data.MediaListCollection.lists.map((list: any) => (
              <React.Fragment key={list.name}>
                <h4 className="text-left text-base md:text-2xl">{list.name}</h4>
                <div className="bg-secondary/30">
                  <div className="flex justify-between p-3">
                    <div>Title</div>
                    <span>Progress</span>
                  </div>

                  {list.length !== 0 ? (
                    list.entries.map((item: any) => (
                      <CardItem
                        key={item.id}
                        id={item.media.id}
                        progress={`${item.progress}`}
                        episodes={`${item.media.episodes}`}
                        title={item.media.title.romaji}
                        cover={item.media.coverImage.large}
                      />
                    ))
                  ) : (
                    <div>
                      {isCurrentUser ? (
                        <p className="text-center font-bold lg:text-lg">
                          Oops!<br></br> Looks like you haven&apos;t watch
                          anything yet.
                        </p>
                      ) : (
                        <p className="text-center font-bold lg:text-lg">
                          Oops!<br></br> It looks like this user haven&apos;t
                          watch anything yet.
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>
    )
  } else {
    return <div>Something went Wrong!</div>
  }
}

function CardItem({
  title,
  cover,
  progress,
  episodes,
  id,
  children,
}: {
  id: string
  title: string
  cover: string
  progress: string
  episodes: string
  children?: React.ReactNode
}) {
  return (
    <Link
      href={`/anime/${transformedTitle(title)}/${id}`}
      className="flex items-center justify-between gap-2 px-3 py-2 hover:bg-primary/50"
    >
      <div className="grid grid-cols-[56px_1fr] items-center gap-1 ">
        <NextImage
          classnamecontainer="w-12 h-14 relative"
          fill
          alt=""
          className="rounded-md"
          style={{ objectFit: "cover" }}
          src={cover}
        />
        <div>
          <h4 className="text-xs">{title}</h4>
          {children}
        </div>
      </div>
      {progress || episodes ? (
        <span className="text-xs">
          {progress === episodes
            ? progress
            : episodes === null
              ? progress
              : `${progress}/${episodes}`}
        </span>
      ) : null}
    </Link>
  )
}

function convertMinutesToDays(minutes: number) {
  const hours = minutes / 60
  const days = hours / 24

  if (days >= 1) {
    return days % 1 === 0 ? { days: `${days}` } : { days: `${days.toFixed(1)}` }
  } else {
    return hours % 1 === 0
      ? { hours: `${hours}` }
      : { hours: `${hours.toFixed(1)}` }
  }
}

function UnixTimeConverter({ unixTime }: { unixTime: number }) {
  const date = new Date(unixTime * 1000) // multiply by 1000 to convert to milliseconds
  const formattedDate = date.toISOString().slice(0, 10) // format date to YYYY-MM-DD

  return <p>{formattedDate}</p>
}

export default Profile
