import imgRectangle6537 from "figma:asset/052a3ae1fed9a10fabfd3fcb18c34cbc209b9bc6.png";
import imgRectangle6539 from "figma:asset/c7319cef2b86a8f71b6765b77a10caccb7fc8b83.png";
import imgRectangle6540 from "figma:asset/39a095c5219433210528f313f4db7ed09e8b6466.png";

function MaskGroup() {
  return (
    <div
      className="absolute contents left-0 top-[-108px]"
      data-name="Mask group"
    >
      <div className="absolute flex h-[388.656px] items-center justify-center right-[-216.426px] top-[-130.169px] w-[403.022px]">
        <div className="flex-none rotate-[35.253deg]">
          <div
            className="bg-[#e9e2c7] h-[253.963px] mask-alpha mask-intersect mask-no-clip mask-no-repeat mask-position-[-22.1388px_22.1688px] mask-size-[356.177px_343.699px] opacity-40 w-[314.352px]"
            style={{ maskImage: `url('${imgRectangle6537}')` }}
          />
        </div>
      </div>
    </div>
  );
}

function BgIllustration() {
  return (
    <div
      className="absolute h-[121px] overflow-clip right-0 top-0 w-[209px]"
      data-name="bg illustration"
    >
      <MaskGroup />
    </div>
  );
}

function Frame13() {
  return (
    <div className="relative shrink-0">
      <div className="box-border content-stretch flex flex-row gap-2 items-center justify-start p-0 relative">
        <div className="flex flex-col font-['Inter:Regular',_sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[#000000] text-[16px] text-left text-nowrap tracking-[-0.16px]">
          <p className="adjustLetterSpacing block leading-[24px] whitespace-pre">
            1
          </p>
        </div>
        <div className="flex h-[4px] items-center justify-center relative shrink-0 w-[7px]">
          <div className="flex-none rotate-[90deg]">
            <div className="h-[7px] relative w-[3.5px]">
              <div className="absolute bottom-[-5.051%] left-[-10.101%] right-[-20.203%] top-[-5.051%]">
                <svg
                  className="block size-full"
                  fill="none"
                  preserveAspectRatio="none"
                  viewBox="0 0 6 9"
                >
                  <path
                    d="M1 1L4.5 4.5L1 8"
                    id="Vector 26"
                    stroke="var(--stroke-0, black)"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Input() {
  return (
    <div
      className="absolute bg-[#ffffff] right-6 rounded-lg top-4"
      data-name="Input"
    >
      <div className="absolute border border-neutral-200 border-solid inset-0 pointer-events-none rounded-lg" />
      <div className="relative size-full">
        <div className="box-border content-stretch flex flex-col gap-2 items-start justify-start px-4 py-3 relative">
          <Frame13 />
        </div>
      </div>
    </div>
  );
}

export default function AddToCartOverlay() {
  return (
    <div
      className="bg-[#426b1f] relative rounded-tl-[8px] rounded-tr-[8px] size-full"
      data-name="Add to cart overlay"
    >
      <div className="absolute bg-[#426b1f] h-[39px] left-0 top-[82px] w-[375px]" />
      <BgIllustration />
      <div className="absolute flex flex-col font-['Inter:Regular',_sans-serif] font-normal justify-center leading-[0] left-[88px] not-italic text-[#ffffff] text-[18px] text-left text-nowrap top-[50px] translate-y-[-50%]">
        <p className="block leading-[16px] whitespace-pre">Heirloom tomato</p>
      </div>
      <div className="absolute flex flex-col font-['Inter:Regular',_sans-serif] font-normal justify-center leading-[0] left-[88px] not-italic opacity-50 text-[#ffffff] text-[16px] text-left text-nowrap top-[30px] translate-y-[-50%]">
        <p className="block leading-[16px] whitespace-pre">Adding to basket:</p>
      </div>
      <Input />
      <div
        className="[background-size:cover,_cover,_cover,_auto] absolute bg-[#d9d9d9] left-6 rounded size-12 top-4"
        style={{
          backgroundImage: `url('${imgRectangle6539}'), url('${imgRectangle6540}'), url('${imgRectangle6539}')`,
        }}
      >
        <div className="absolute border border-[rgba(0,0,0,0.1)] border-solid inset-0 pointer-events-none rounded" />
      </div>
    </div>
  );
}