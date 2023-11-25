# RangeManger

RangeManger, a drop-in React component, is somewhere between `<input type="range" />` and Google Calendar. It's meant for defining multiple one-dimensional ranges with fine-grained controls.

I made it for tracking my baby's naps, but you do you.

## Features
- Create multiple ranges with touch-friendly interactions that mimic popular calendar apps
- Lock down individual thumbs, then move the unlocked parts as one unit. Slide that schedule for later in the day! ☕️
- Units of measurement include **numbers** and **hours of the day** (it's easy to add more)
- Define ranges by many different factors including start/end, start/length, and intervals between ranges
- Give your individual ranges colours and names for those Vaporwave-themed events

## Performance 
- Dragging and animations are driven by pure JS, without rapid-fire state changes and reloads  
- 2 tiny dependencies (that you're probably already using)

# Usage
The `<Range />` component can be used as many times as you like inside of `<RangeManger />` to load the component with prefab ranges:

	import RangeManger, {Range} from 'range-manger'
	
	<RangeManger>
    	<Range className="first" x="0" size="10" fixed="left" />
    	<Range className="second" x="40" size="10" />
    	<Range className="second" x="60" size="10" />
    	<Range x="90" size="10" fixed="right" />
	</RangeManger>
Or you can render an empty `<RangeManger />` and add ranges using the UI. The ranges are stored in localStorage unless `localStoreData="false"`.

# Props
## &lt;RangeManger /&gt;
| Name | Default | Description |
| --- | --- | --- |
| onChange | `null` | The most precious of all. Bind a handlerFunction(data), wherein data will contain everything the component has stored about its range(s). This event fires when range parameters are set on mouseup/touchend/blur; it does *not* fire *while* ranges are being dragged. |
| disableTouchDrag | `true` | If `true`, the viewport's scrolling is disabled while touch events are happening on the component
| maxItems | `5` | A limit to the insanity of infinite ranges (eventually they will be too small to be useful)
| units | `"time"` | `"time\|numerical"` |
| gamut | `["700","2100"]` | `[min,max]` either 24-hr clock values or numbers
| gradiation | `120` | An integer of space between optical gradiation, either numbers or minutes, depending on your `units` prop
| changeColor | `true` | Allow colouring of individual ranges
| addMore | `true` | Show the "add" button to add more ranges
| showInfo | `true` | Allow click on ranges to change their parameters
| showTitles | `true` | Show titles for each range
| useTheme | `true` | Load default styles to make the manger look nice. Set `false` to roll your own css
| localStoreData | `true` | Persist changes in localStorage

## &lt;Range /&gt;
| Name | Default | Description |
| --- | --- | --- |
| x | `0` | The x-value of the range's left bound, expressed as a percentage float out of 100, eg. `x="42.2"`
| size | `10` | The length of the range, expressed as a percentage float out of 100
| fixed | `null` | Lock down the sides of a range to prevent it from being resized. `"left\|right\|both"` |
| color | `null` | CSS hex
| className, ... | `null` | Additional attributes are passed on as `[...props]`