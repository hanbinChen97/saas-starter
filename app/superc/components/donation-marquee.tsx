'use client';

import Marquee from 'react-fast-marquee';

export default function DonationMarquee() {
  return (
    <Marquee
      pauseOnHover={true}
      gradient={false}
      speed={30}
      className="bg-orange-100 py-2 text-orange-800 font-medium"
    >
      <span className="mx-8">💰 感谢 @FeNGgUnC 的打赏支持！</span>
      <span className="mx-8">💰 感谢 @梨园摘樱桃 的打赏支持！</span>
      <span className="mx-8">💰 感谢 匿名留子 *** 的打赏支持！</span>
      <span className="mx-8">💰 感谢 匿名留子 *** 的打赏支持！</span>
      <span className="mx-8">💰 感谢 一口一碗凉粉 的打赏支持！</span>
    </Marquee>
  );
}