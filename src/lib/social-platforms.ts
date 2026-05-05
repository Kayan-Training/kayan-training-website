import {
  DiscordIcon,
  Facebook01Icon,
  GithubIcon,
  InstagramIcon,
  Linkedin01Icon,
  NewTwitterIcon,
  SnapchatIcon,
  TelegramIcon,
  TiktokIcon,
  TwitchIcon,
  WhatsappIcon,
  YoutubeIcon,
} from "@hugeicons/core-free-icons";

export const SOCIAL_PLATFORM_OPTIONS = [
  { value: "linkedin", label: "LinkedIn", icon: Linkedin01Icon },
  { value: "x", label: "X / Twitter", icon: NewTwitterIcon },
  { value: "instagram", label: "Instagram", icon: InstagramIcon },
  { value: "youtube", label: "YouTube", icon: YoutubeIcon },
  { value: "facebook", label: "Facebook", icon: Facebook01Icon },
  { value: "tiktok", label: "TikTok", icon: TiktokIcon },
  { value: "whatsapp", label: "WhatsApp", icon: WhatsappIcon },
  { value: "telegram", label: "Telegram", icon: TelegramIcon },
  { value: "snapchat", label: "Snapchat", icon: SnapchatIcon },
  { value: "discord", label: "Discord", icon: DiscordIcon },
  { value: "github", label: "GitHub", icon: GithubIcon },
  { value: "twitch", label: "Twitch", icon: TwitchIcon },
] as const;

export type SocialPlatformKey = (typeof SOCIAL_PLATFORM_OPTIONS)[number]["value"];
