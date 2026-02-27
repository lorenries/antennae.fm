export type Station = {
  id: string;
  name: string;
  url: string;
  useProxy?: boolean;
  metadataStrategy?: "icy" | "none";
  metadataSplit?: "artist-title" | "title-artist";
};

export const stations: Station[] = [
  // {
  //   url: "http://stream.live.vc.bbcmedia.co.uk/bbc_6music",
  //   id: "bbc6",
  //   name: "BBC6",
  // },
  {
    url: "https://dublab.out.airtime.pro/dublab_a",
    id: "dublab",
    name: "Dublab",
  },
  {
    url: "https://streams.kcrw.com/kcrw_mp3",
    id: "kcrw",
    name: "KCRW",
    metadataSplit: "title-artist",
  },
  {
    url: "http://s-00.wefunkradio.com:81/wefunk64.mp3",
    id: "wefunk",
    name: "WEFUNK",
  },
  {
    url: "https://n10as.radiocult.fm/stream",
    id: "n10as",
    name: "n10.as",
    useProxy: false,
  },
  { url: "https://wxpnhi.xpn.org/xpnhi-nopreroll", id: "wxpn", name: "WXPN" },
  {
    url: "http://icecast.vrtcdn.be/stubru-high.mp3",
    id: "stubru",
    name: "StuBru",
  },
  {
    url: "http://wumb.streamguys1.com/wumb919fast",
    id: "wumb",
    name: "WUMB",
    metadataSplit: "title-artist",
  },
  {
    url: "http://stream.kalx.berkeley.edu:8000/kalx-128.mp3",
    id: "kalx",
    name: "KALX",
  },
  {
    url: "https://nova-dance.ice.infomaniak.ch/nova-dance-128",
    id: "novadanse",
    name: "Radio Nova Danse",
  },
  {
    url: "https://nyc-prod-catalyst-0.lp-playback.studio/hls/video+85c28sa2o8wppm58/1_0/index.m3u8",
    id: "thelot",
    name: "The Lot",
    useProxy: false,
    metadataStrategy: "none",
  },
  {
    url: "https://kioskradiobxl.out.airtime.pro/kioskradiobxl_a",
    id: "kiosk",
    name: "Kiosk",
  },
];

export function getStationById(id: string) {
  return stations.find((station) => station.id === id);
}
