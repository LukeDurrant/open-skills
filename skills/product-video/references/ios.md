# Filming an iOS app

The footage is the iOS Simulator recording a UI test that performs each shot. This path has been run end to end.

## 1. Find how the app is seeded

Look for what the repo already uses for App Store screenshots or UI tests:

- a "screenshot mode" or launch-environment flags (`UI_TEST_*`, `-FASTLANE_SNAPSHOT`, `ProcessInfo.processInfo.environment`),
- fixture files decoded through the real DTOs,
- existing UI tests that launch into the state you need — their helpers show the exact flags and accessibility identifiers.

Reuse these. They exist so the app renders a known, presentable state without a sign-in or a network call. If a feature has no fixture, add one the same way the others are built and commit it. Without any fixture mechanism, add a small debug-only one rather than filming a signed-in account.

## 2. Write the shots

Add one UI test class (for example `VideoShots`) to the existing UI test target, one `func test_NN_name()` per shot. Model it on the repo's existing UI tests.

```swift
func test_02_search() throws {
    let app = launch(fixture: "sampleData")          // the repo's own flags
    let search = app.textFields["search.field"]
    for _ in 0..<12 where !(search.exists && search.isHittable) { app.swipeUp(velocity: 1800) }
    pause(1.5)                                       // a settled state to hold on
    search.tap()
    pause(0.8)
    for character in "note" {                        // type at a human pace
        search.typeText(String(character))
        pause(0.12)
    }
    XCTAssertTrue(app.buttons["result.add.0"].waitForExistence(timeout: 5))
    pause(1.5)
    app.buttons["result.add.0"].tap()
    pause(2.5)                                       // the payoff needs the longest hold
}
```

- Pause before and after every action. Dead time is free (the edit skips it); a missing hold cannot be recovered.
- For a readable scroll use a slow drag (`press(forDuration:thenDragTo:withVelocity:thenHoldForDuration:)`) rather than a fling.
- Find elements by accessibility identifier, as the existing tests do. Don't wait on text that changes with the data.
- If the Xcode project lists files explicitly (search the `.pbxproj` for an existing UI test's file name), register the new file the same way: a `PBXBuildFile`, a `PBXFileReference`, the group entry and the Sources entry. Projects using synchronized folders need nothing.

## 3. Record

```sh
<kit>/capture-ios.sh --project App.xcodeproj --scheme <scheme> \
  --tests "<UITestTarget>/VideoShots" --out <scratch>/shots test_01_plan test_02_search
```

It boots the simulator, sets a clean status bar, builds once, and records one `.mov` per shot. If the repo already has its own capture script for video shots, use that instead.

- Show the user the Simulator while it runs if they are watching; otherwise it can run in the background.
- One simulator, one recording: never run two captures in parallel.
- A fresh worktree may fail the build on a script phase that needs `node_modules`: install dependencies there first.
- Light appearance usually matches a light brand ground: `xcrun simctl ui <udid> appearance light`.

## 4. Cut

```sh
<kit>/footage.sh sheet <scratch>/shots/test_02_search.mov sheet.jpg     # numbers are seconds
<kit>/footage.sh cut   <scratch>/shots/test_02_search.mov <video-dir>/footage/search 20.0 11.0
<kit>/footage.sh sheet <video-dir>/footage/search sheet2.jpg            # numbers × 8 = frame
```

The first seconds of every movie are the home screen and the app launching: cut from where the app's first real screen is up. Launch time varies between captures, so re-check the start after any re-shoot.

In the composition use `frame: "phone"` and `footage: { width: 804, height: <as cut> }`.

## Things that go wrong

- **A screen shows an email, a token or an inconsistent state** (a settings tab with a stored value from an earlier run). Drop the shot or add a fixture; don't film around it.
- **The software keyboard** covers the lower half of the screen while typing. Keep the thing you want seen in the top half, or dismiss the keyboard before the payoff.
- **The action is low on the screen** (a bottom sheet). Give that scene a `pose` so the whole phone is visible in beat B.
