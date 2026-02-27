export type Station = {
  id: string;
  name: string;
  url: string;
  useProxy?: boolean;
};

export const stations: Station[] = [
  {
    url: "http://stream.live.vc.bbcmedia.co.uk/bbc_6music",
    id: "bbc6",
    name: "BBC6",
  },
  {
    url: "https://dublab.out.airtime.pro/dublab_a",
    id: "dublab",
    name: "Dublab",
  },
  {
    url: "https://kcrw.streamguys1.com/kcrw_192k_mp3_e24",
    id: "kcrw",
    name: "KCRW",
  },
  {
    url: "http://s-00.wefunkradio.com:81/wefunk64.mp3",
    id: "wefunk",
    name: "WEFUNK",
  },
  {
    url: "https://balamii.out.airtime.pro:8000/balamii_a",
    id: "balamii",
    name: "Balamii",
  },
  {
    url: "http://n10as.out.airtime.pro:8000/n10as_a",
    id: "n10as",
    name: "n10.as",
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
  },
];

export function getStationById(id: string) {
  return stations.find((station) => station.id === id);
}
